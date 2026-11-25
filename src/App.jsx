import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { StoreProvider } from './context/StoreContext'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import CatalogPage from './pages/CatalogPage'
import ProductDetailPage from './pages/ProductDetailPage'
import CartCheckoutPage from './pages/CartCheckoutPage'
import AccountPage from './pages/AccountPage'
import OrderTrackingPage from './pages/OrderTrackingPage'
import AdminPage from './pages/AdminPage'

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/catalogue" element={<CatalogPage mode="all" />} />
            <Route path="/catalogue/:categorySlug" element={<CatalogPage mode="all" />} />
            <Route path="/promotions" element={<CatalogPage mode="promotions" />} />
            <Route path="/nouveautes" element={<CatalogPage mode="new" />} />
            <Route path="/produit/:slug" element={<ProductDetailPage />} />
            <Route path="/panier" element={<CartCheckoutPage />} />
            <Route path="/mon-compte" element={<AccountPage />} />
            <Route path="/suivi-commande" element={<OrderTrackingPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </StoreProvider>
  )
}
