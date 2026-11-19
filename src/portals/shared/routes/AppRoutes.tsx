import { Navigate, Route, Routes } from 'react-router-dom';
import { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { getInitialRoute } from '../utils/auth/getInitialRoute';
import PrivateLayout from '../layouts/PrivateLayout';
import StoreLayout from '../../store/layouts/StoreLayout';
import TenantSubscriptionGate from '../../tenant/components/subscriptions/TenantSubscriptionGate';
import TenantDashboard from '../../tenant/pages/TenantDashboard';
import StoreDashboard from '../../store/pages/Dashboard';
import Domains from '../../tenant/pages/domains/Domains';
import Categories from '../../tenant/pages/categories/Categories';
import Subcategories from '../../tenant/pages/subcategories/Subcategories';
import Brands from '../../tenant/pages/brands/Brands';
import Stores from '../../tenant/pages/stores/Stores';
import StoreSettings from '../../tenant/pages/stores/StoreSettings';
import PosStoreSettings from '../../store/pages/stores/PosStoreSettings';
import Suppliers from '../../tenant/pages/suppliers/Suppliers';
import Units from '../../tenant/pages/units/Units';
import Products from '../../tenant/pages/products/Products';
import Users from '../../tenant/pages/users/Users';
import Login from '../pages/auth/Login';
import TenantPlans from '../pages/auth/TenantPlans';
import TenantSignup from '../pages/auth/TenantSignup';
import ProtectedRoute from './ProtectedRoute';
import RoleAccessGate from '../components/common/RoleAccessGate';
import TenantSettings from '../../tenant/pages/settings/TenantSettings';
import FinancialAccounts from '../../tenant/pages/settings/FinancialAccounts';
import Roles from '../../tenant/pages/roles/Roles';
import Devises from '../../tenant/pages/devises/Devises';
import Languages from '../../tenant/pages/languages/Languages';
import TenantSubscription from '../../tenant/pages/subscriptions/TenantSubscription';
import PasswordRecovery from '../pages/auth/PasswordRecovery';
import ChangePassword from '../pages/auth/ChangePassword';
import LoginOtp from '../pages/auth/LoginOtp';
import POS from '../../store/pages/pos/POS';
import POSSessions from '../../store/pages/pos/POSSessions';
import Stocks from '../../store/pages/stocks/Stocks';
import StockMovements from '../../store/pages/stock-movements/StockMovements';
import Inventories from '../../store/pages/inventories/Inventories';
import StockTransfers from '../../store/pages/stock-transfers/StockTransfers';
import Customers from '../../store/pages/customers/Customers';
import Sales from '../../store/pages/sales/Sales';
import SaleShow from '../../store/pages/sales/SaleShow';
import SaleEdit from '../../store/pages/sales/SaleEdit';
import Quotations from '../../store/pages/quotations/Quotations';
import Deliveries from '../../store/pages/deliveries/Deliveries';
import Payments from '../../store/pages/payments/Payments';
import SaleReturns from '../../store/pages/sale-returns/SaleReturns';
import Receivables from '../../store/pages/sales/Receivables';
import ReceivableDetails from '../../store/pages/sales/ReceivableDetails';
import Purchases from '../../store/pages/purchases/Purchases';
import PurchasePayments from '../../store/pages/purchase-payments/PurchasePayments';
import PurchaseReturns from '../../store/pages/purchase-returns/PurchaseReturns';
import Expenses from '../../store/pages/expenses/Expenses';
import ExpenseCategories from '../../store/pages/expenses/ExpenseCategories';
import Reports from '../../store/pages/reports/Reports';
import StoreFinancialAccounts from '../../store/pages/settings/FinancialAccounts';

function HomeRedirect() {
  const { auth } = useContext(AppContext);

  return (
    <Navigate
      to={getInitialRoute(auth?.permissions || [], auth?.user?.roles || [])}
      replace
    />
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<ProtectedRoute />}>
        <Route element={<RoleAccessGate />}>
          <Route element={<PrivateLayout />}>
            <Route path="/access-denied" element={<div className="container py-4"><div className="alert alert-danger" role="alert">Aucun module ne vous est attribué. Contactez un administrateur.</div></div>} />
            <Route path="/change-password" element={<ChangePassword />} />
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/tenant-subscription" element={<TenantSubscription />} />
            <Route element={<TenantSubscriptionGate />}>
              <Route path="/tenant-dashboard" element={<TenantDashboard />} />
              <Route path="/domains" element={<Domains />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/subcategories" element={<Subcategories />} />
              <Route path="/brands" element={<Brands />} />
              <Route path="/units" element={<Units />} />
              <Route path="/products" element={<Products />} />
              <Route path="/stores" element={<Stores />} />
              <Route path="/stores/:id/settings" element={<StoreSettings />} />
              <Route path="/stores/:id/devises" element={<Devises />} />
              <Route path="/suppliers" element={<Suppliers />} />
              <Route path="/users" element={<Users />} />
              <Route path="/roles" element={<Roles />} />
              <Route path="/tenant-settings" element={<TenantSettings />} />
              <Route path="/financial-accounts" element={<FinancialAccounts />} />
              <Route path="/tenant/devises" element={<Devises />} />
              <Route path="/languages" element={<Languages />} />
            </Route>
          </Route>
          <Route path="/pos" element={<StoreLayout />}>
            <Route index element={<POS />} />
            <Route path="dashboard" element={<StoreDashboard />} />
            <Route path="sessions" element={<POSSessions />} />
            <Route path="stocks" element={<Stocks />} />
            <Route path="stock-movements" element={<StockMovements />} />
            <Route path="inventories" element={<Inventories />} />
            <Route path="stock-transfers" element={<StockTransfers />} />
            <Route path="customers" element={<Customers />} />
            <Route path="sales" element={<Sales />} />
            <Route path="sales/:id" element={<SaleShow />} />
            <Route path="sales/:id/edit" element={<SaleEdit />} />
            <Route path="quotations" element={<Quotations />} />
            <Route path="deliveries" element={<Deliveries />} />
            <Route path="payments" element={<Payments />} />
            <Route path="sale-returns" element={<SaleReturns />} />
            <Route path="receivables" element={<Receivables />} />
            <Route path="receivables/:customerId" element={<ReceivableDetails />} />
            <Route path="purchases" element={<Purchases />} />
            <Route path="purchase-payments" element={<PurchasePayments />} />
            <Route path="purchase-returns" element={<PurchaseReturns />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="expenses/categories" element={<ExpenseCategories />} />
            <Route path="reports" element={<Reports />} />
            <Route path="financial-accounts" element={<StoreFinancialAccounts />} />
            <Route path="stores/:id/settings" element={<PosStoreSettings />} />
            <Route path="stores/:id/devises" element={<Devises />} />
          </Route>
        </Route>
      </Route>
      <Route path="/login" element={<Login />} />
      <Route path="/login/otp" element={<LoginOtp />} />
      <Route path="/signup" element={<TenantPlans />} />
      <Route path="/signup/:planId" element={<TenantSignup />} />
      <Route path="/forgot-password" element={<PasswordRecovery step="email" />} />
      <Route path="/otp-verify" element={<PasswordRecovery step="otp" />} />
      <Route path="/password-reset" element={<PasswordRecovery step="reset" />} />
    </Routes>
  );
}
