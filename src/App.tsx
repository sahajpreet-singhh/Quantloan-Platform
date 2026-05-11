/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Auth from './pages/Auth';
import Marketplace from './pages/Marketplace';
import Dashboard from './pages/Dashboard';
import BorrowerForm from './pages/BorrowerForm';
import LoanDetails from './pages/LoanDetails';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Auth />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/borrower" element={<BorrowerForm />} />
          <Route path="/loan/:id" element={<LoanDetails />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}
