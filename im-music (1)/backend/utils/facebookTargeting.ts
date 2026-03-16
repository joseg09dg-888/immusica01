import { Branding } from '../models/Branding';

interface FacebookTargetingParams {
  geo_locations: any;
  interests?: any[];
  age_min?: number;
  age_max?: number;
  genders?: number[];
  behaviors?: any[];
  [key: string]: any;
}

export const mapBrandingToTargeting = (branding: Branding): FacebookTargetingParams => {
  const targeting: FacebookTargetingParams = {
    geo_locations: { countries: [], regions: [], cities: [] }
  };

  // 1. Mapear mercados prioritarios (países)
  if (branding.mercados_prioritarios) {
    try {
      const mercados = typeof branding.mercados_prioritarios === 'string' 
        ? JSON.parse(branding.mercados_prioritarios) 
        : branding.mercados_prioritarios;
        
      if (Array.isArray(mercados)) {
        mercados.forEach((mercado: string) => {
          if (mercado.includes('Colombia')) targeting.geo_locations.countries.push('CO');
          if (mercado.includes('México')) targeting.geo_locations.countries.push('MX');
          if (mercado.includes('España')) targeting.geo_locations.countries.push('ES');
          if (mercado.includes('Chile')) targeting.geo_locations.countries.push('CL');
          if (mercado.includes('Argentina')) targeting.geo_locations.countries.push('AR');
          if (mercado.includes('Estados Unidos') || mercado.includes('USA')) targeting.geo_locations.countries.push('US');
        });
      }
    } catch (e) {
      console.error('Error parsing mercados_prioritarios', e);
    }
  }

  // 2. Mapear perfil de oyente a intereses y demografía
  if (branding.perfil_oyente) {
    const perfil = branding.perfil_oyente.toLowerCase();
    
    targeting.interests = [];
    if (perfil.includes('emprendedores') || perfil.includes('negocios')) {
      targeting.interests.push({ id: '6003139266461', name: 'Entrepreneurship' });
    }
    if (perfil.includes('fitness') || perfil.includes('deportes')) {
      targeting.interests.push({ id: '6003139266462', name: 'Fitness' });
    }
    if (perfil.includes('moda')) {
      targeting.interests.push({ id: '6003139266463', name: 'Fashion' });
    }
    if (perfil.includes('tecnología')) {
      targeting.interests.push({ id: '6003139266464', name: 'Technology' });
    }
    if (perfil.includes('música') || perfil.includes('conciertos')) {
      targeting.interests.push({ id: '6003139266465', name: 'Music' });
    }

    // Extraer edad (si el perfil lo especifica)
    const edadMatch = perfil.match(/(\d+)\s*a\s*(\d+)/);
    if (edadMatch) {
      targeting.age_min = parseInt(edadMatch[1]);
      targeting.age_max = parseInt(edadMatch[2]);
    } else {
      // Default age range
      targeting.age_min = 18;
      targeting.age_max = 45;
    }
  }

  // 3. Mapear lenguaje de tribu a comportamientos
  if (branding.lenguaje_tribu) {
    targeting.behaviors = targeting.behaviors || [];
    if (branding.lenguaje_tribu.includes('💪') || branding.lenguaje_tribu.includes('fuerza')) {
      targeting.behaviors.push({ id: '6002714895372', name: 'Frequent travelers' });
    }
  }

  return targeting;
};
