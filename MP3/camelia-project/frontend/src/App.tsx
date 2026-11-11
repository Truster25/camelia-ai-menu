import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Menu } from './pages/Menu';
import { DishDetail } from './pages/DishDetail';
import { Recommend } from './pages/Recommend';
import { HowItWorks } from './pages/HowItWorks';
import { Login } from './pages/Login';
import { Cart } from './pages/Cart';
import { Orders } from './pages/Orders';
import { Admin } from './pages/Admin';
import { useAuth } from './context/AuthContext';
import { Spinner } from './components/ui';

function AdminRoute() {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <Spinner label="Checking permissions…" />;
  if (!isAdmin) return <Navigate to={user ? '/' : '/login'} replace state={{ from: '/admin' }} />;
  return <Admin />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="menu" element={<Menu />} />
        <Route path="menu/:id" element={<DishDetail />} />
        <Route path="recommend" element={<Recommend />} />
        <Route path="how-it-works" element={<HowItWorks />} />
        <Route path="login" element={<Login />} />
        <Route path="cart" element={<Cart />} />
        <Route path="orders" element={<Orders />} />
        <Route path="admin" element={<AdminRoute />} />
        <Route
          path="*"
          element={
            <div className="mx-auto max-w-2xl px-5 py-24 text-center">
              <p className="font-display text-6xl text-amber-soft">404</p>
              <h1 className="mt-4 font-display text-3xl">This page is not on the menu</h1>
              <p className="mt-3 text-sm text-sage-400">The link you followed does not exist.</p>
              <a href="/" className="btn-primary mt-6 inline-flex">Back home</a>
            </div>
          }
        />
      </Route>
    </Routes>
  );
}
