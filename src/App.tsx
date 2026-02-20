/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ProjectList from './pages/ProjectList';
import ProjectDetails from './pages/ProjectDetails';
import ProjectForm from './pages/ProjectForm';

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/projects" element={<ProjectList />} />
          <Route path="/projects/new" element={<ProjectForm />} />
          <Route path="/projects/:id" element={<ProjectDetails />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
