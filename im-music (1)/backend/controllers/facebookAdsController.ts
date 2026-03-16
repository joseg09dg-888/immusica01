import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as ArtistModel from '../models/Artist';
import * as BrandingModel from '../models/Branding';
import { mapBrandingToTargeting } from '../utils/facebookTargeting';
import axios from 'axios';

const FB_GRAPH_URL = 'https://graph.facebook.com/v25.0';
const FB_AD_ACCOUNT_ID = process.env.FB_AD_ACCOUNT_ID; 
const FB_ACCESS_TOKEN = process.env.FB_SYSTEM_USER_TOKEN;

interface CreateCampaignBody {
  campaignName: string;
  objective: 'OUTCOME_TRAFFIC' | 'OUTCOME_SALES' | 'OUTCOME_AWARENESS';
  budgetType: 'daily' | 'lifetime';
  budgetAmount: number; // en centavos (ej. 1000 = $10.00)
  startDate: string; // ISO string
  endDate?: string; // solo para lifetime budget
  creative?: {
    title?: string;
    body?: string;
    imageUrl?: string;
    callToAction?: 'LEARN_MORE' | 'SHOP_NOW' | 'SIGN_UP';
    websiteUrl?: string;
  };
}

export const createFacebookCampaign = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });
    if (!FB_AD_ACCOUNT_ID || !FB_ACCESS_TOKEN) {
      return res.status(500).json({ error: 'Facebook API no configurada. Verifica FB_AD_ACCOUNT_ID y FB_SYSTEM_USER_TOKEN' });
    }

    // Obtener el artista del usuario
    const artists = ArtistModel.getArtistsByUser(req.user.id);
    if (artists.length === 0) return res.status(404).json({ error: 'No hay artista asociado' });
    const artist = artists[0];

    // Obtener el branding del artista
    const branding = BrandingModel.getBrandingByArtist(artist.id);
    if (!branding || !branding.arquetipo) {
      return res.status(400).json({ error: 'Completa el branding primero' });
    }

    // Datos de la campaña enviados por el frontend
    const campaignData: CreateCampaignBody = req.body;
    const { campaignName, objective, budgetType, budgetAmount, startDate, endDate, creative } = campaignData;

    // Mapear el branding a segmentación de Facebook
    const targeting = mapBrandingToTargeting(branding);

    // 1. Crear la campaña en Facebook
    const campaignPayload: any = {
      name: campaignName || `${artist.name} - ${branding.arquetipo} Campaign`,
      objective: objective,
      status: 'PAUSED', // La creamos pausada para revisión
      special_ad_categories: [], 
      access_token: FB_ACCESS_TOKEN
    };

    if (budgetType === 'daily') {
      campaignPayload.daily_budget = budgetAmount; 
      campaignPayload.bid_strategy = 'LOWEST_COST_WITHOUT_CAP';
    } else {
      campaignPayload.lifetime_budget = budgetAmount;
      campaignPayload.bid_strategy = 'LOWEST_COST_WITHOUT_CAP';
    }

    const campaignResponse = await axios.post(
      `${FB_GRAPH_URL}/${FB_AD_ACCOUNT_ID}/campaigns`,
      campaignPayload
    );
    const campaignId = campaignResponse.data.id;

    // 2. Crear el conjunto de anuncios (Ad Set) con la segmentación
    const adSetPayload: any = {
      name: `${campaignName || artist.name} - Ad Set`,
      campaign_id: campaignId,
      status: 'PAUSED',
      billing_event: 'IMPRESSIONS',
      optimization_goal: objective === 'OUTCOME_SALES' ? 'OFFSITE_CONVERSIONS' : 'LINK_CLICKS',
      targeting: targeting,
      start_time: new Date(startDate).toISOString(),
      access_token: FB_ACCESS_TOKEN
    };

    if (budgetType === 'daily') {
      adSetPayload.daily_budget = budgetAmount;
    } else {
      adSetPayload.lifetime_budget = budgetAmount;
      if (endDate) {
        adSetPayload.end_time = new Date(endDate).toISOString();
      }
    }

    const adSetResponse = await axios.post(
      `${FB_GRAPH_URL}/${FB_AD_ACCOUNT_ID}/adsets`,
      adSetPayload
    );
    const adSetId = adSetResponse.data.id;

    // 3. Crear el anuncio (Ad) con el creativo (si se proporciona)
    let adId = null;
    if (creative && creative.websiteUrl) {
      const creativePayload: any = {
        name: `${campaignName || artist.name} - Creative`,
        object_story_spec: {
          page_id: process.env.FB_PAGE_ID, 
          link_data: {
            link: creative.websiteUrl,
            message: creative.body || 'Descubre más',
            name: creative.title || artist.name,
            call_to_action: { type: creative.callToAction || 'LEARN_MORE' }
          }
        },
        access_token: FB_ACCESS_TOKEN
      };

      const creativeResponse = await axios.post(
        `${FB_GRAPH_URL}/${FB_AD_ACCOUNT_ID}/adcreatives`,
        creativePayload
      );
      const creativeId = creativeResponse.data.id;

      const adPayload = {
        name: `${campaignName || artist.name} - Ad`,
        adset_id: adSetId,
        creative: { creative_id: creativeId },
        status: 'PAUSED',
        access_token: FB_ACCESS_TOKEN
      };

      const adResponse = await axios.post(
        `${FB_GRAPH_URL}/${FB_AD_ACCOUNT_ID}/ads`,
        adPayload
      );
      adId = adResponse.data.id;
    }

    res.json({
      success: true,
      message: 'Campaña creada en Facebook (pausada)',
      campaignId,
      adSetId,
      adId,
      targetingUsed: targeting 
    });

  } catch (error: any) {
    console.error('Error creating Facebook campaign:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Error al crear campaña en Facebook',
      details: error.response?.data || error.message
    });
  }
};

export const activateFacebookCampaign = async (req: AuthRequest, res: Response) => {
  try {
    const { campaignId } = req.params;
    await axios.post(`${FB_GRAPH_URL}/${campaignId}`, {
      status: 'ACTIVE',
      access_token: FB_ACCESS_TOKEN
    });
    res.json({ success: true, message: 'Campaña activada' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getCampaignInsights = async (req: AuthRequest, res: Response) => {
  try {
    const { campaignId } = req.params;
    const fields = ['impressions', 'clicks', 'spend', 'reach', 'actions', 'cost_per_action_type'];
    const insights = await axios.get(
      `${FB_GRAPH_URL}/${campaignId}/insights`,
      {
        params: {
          fields: fields.join(','),
          access_token: FB_ACCESS_TOKEN,
          date_preset: 'last_30d'
        }
      }
    );
    res.json(insights.data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
