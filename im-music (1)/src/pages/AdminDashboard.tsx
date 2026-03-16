import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from '../components/admin/AdminLayout';
import AdminInbox from '../components/admin/AdminInbox';
import AdminLogs from '../components/admin/AdminLogs';
import AdminTasks from '../components/admin/AdminTasks';
import AdminInfrastructure from '../components/admin/AdminInfrastructure';
import AdminConfig from '../components/admin/AdminConfig';

const AdminDashboard: React.FC = () => {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<AdminInbox />} />
        <Route path="inbox" element={<AdminInbox />} />
        <Route path="logs" element={<AdminLogs />} />
        <Route path="tasks" element={<AdminTasks />} />
        <Route path="infra" element={<AdminInfrastructure />} />
        <Route path="config" element={<AdminConfig />} />
        <Route path="*" element={<Navigate to="inbox" replace />} />
      </Route>
    </Routes>
  );
};

export default AdminDashboard;
