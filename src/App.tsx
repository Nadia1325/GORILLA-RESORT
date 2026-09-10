import { Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import TrustBar from "./components/TrustBar";
import Rooms from "./components/Rooms";
import MistDivider from "./components/MistDivider";
import Experiences from "./components/Experiences";
import OutdoorBar from "./components/OutdoorBar";
import OfferBanner from "./components/OfferBanner";
import Testimonials from "./components/Testimonials";
import Newsletter from "./components/Newsletter";
import Footer from "./components/Footer";
import RoomsPage from "./pages/RoomsPage";
import RoomDetailPage from "./pages/RoomDetailPage";
import ContactMessagePage from "./pages/ContactMessagePage";
import BookingSuccessPage from "./pages/BookingSuccessPage";
import ManagerDashboardPage from "./pages/ManagerDashboardPage";
import ManagerResetPasswordPage from "./pages/ManagerResetPasswordPage";

function Home(){return <main><Hero/><TrustBar/><Rooms/><OutdoorBar/><MistDivider from="#0B1D0A" to="#B36B2E"/><Experiences/><OfferBanner/><Testimonials/><MistDivider from="#B36B2E" to="#0B1D0A" flip/><Newsletter/></main>}

export default function App() {
  return <div className="overflow-x-hidden"><Navbar/><Routes><Route path="/" element={<Home/>}/><Route path="/rooms" element={<RoomsPage/>}/><Route path="/rooms/:slug" element={<RoomDetailPage/>}/><Route path="/contact-message" element={<ContactMessagePage/>}/><Route path="/booking-success" element={<BookingSuccessPage/>}/><Route path="/manager" element={<ManagerDashboardPage/>}/><Route path="/manager/reset-password" element={<ManagerResetPasswordPage/>}/></Routes><Footer/></div>;
}
