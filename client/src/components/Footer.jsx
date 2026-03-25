import { Link } from "react-router-dom";
import {
    FaFacebookF,
    FaInstagram,
    FaWhatsapp,
    FaMapMarkerAlt,
    FaPhoneAlt,
    FaEnvelope,
    FaShoppingBag,
} from "react-icons/fa";

const Footer = () => {
    return (
        <footer className="mt-auto bg-[#0a0812] text-gray-400 border-t border-white/5">

            <div className="max-w-6xl mx-auto px-6 py-14">

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

                    {/* BRAND */}
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-9 h-9 bg-indigo-600 rounded-md flex items-center justify-center">
                                <FaShoppingBag size={16} className="text-white" />
                            </div>
                            <h2 className="text-lg font-semibold text-white">Urbexon</h2>
                        </div>

                        <p className="text-sm text-gray-500 leading-relaxed">
                            Premium shopping destination for fashion and lifestyle products across India.
                        </p>

                        <div className="flex gap-3 mt-4">
                            <a href="#" className="hover:text-white"><FaFacebookF /></a>
                            <a href="#" className="hover:text-white"><FaInstagram /></a>
                            <a href="#" className="hover:text-white"><FaWhatsapp /></a>
                        </div>
                    </div>

                    {/* NAVIGATION */}
                    <div>
                        <h3 className="text-white text-sm font-semibold mb-4">Navigation</h3>
                        <ul className="space-y-2 text-sm">
                            <li><Link to="/" className="hover:text-white">Home</Link></li>
                            <li><Link to="/" className="hover:text-white">Products</Link></li>
                            <li><Link to="/cart" className="hover:text-white">Cart</Link></li>
                            <li><Link to="/orders" className="hover:text-white">My Orders</Link></li>
                        </ul>
                    </div>

                    {/* POLICIES */}
                    <div>
                        <h3 className="text-white text-sm font-semibold mb-4">Policies</h3>
                        <ul className="space-y-2 text-sm">
                            <li><Link to="/privacy-policy" className="hover:text-white">Privacy Policy</Link></li>
                            <li><Link to="/terms-conditions" className="hover:text-white">Terms & Conditions</Link></li>
                            <li><Link to="/refund-policy" className="hover:text-white">Refund Policy</Link></li>
                            <li><Link to="/contact" className="hover:text-white">Contact Us</Link></li>
                        </ul>
                    </div>

                    {/* CONTACT */}
                    <div>
                        <h3 className="text-white text-sm font-semibold mb-4">Contact</h3>

                        <div className="space-y-3 text-sm text-gray-500">
                            <p className="flex items-start gap-2">
                                <FaMapMarkerAlt size={12} />
                                Akbarpur, UP – 224122
                            </p>

                            <a href="tel:+918808485840" className="flex items-center gap-2 hover:text-white">
                                <FaPhoneAlt size={12} />
                                +91 88084 85840
                            </a>

                            <a href="mailto:support@urbexon.com" className="flex items-center gap-2 hover:text-white">
                                <FaEnvelope size={12} />
                                support@urbexon.com
                            </a>
                        </div>
                    </div>

                </div>

                {/* BOTTOM */}
                <div className="border-t border-white/5 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500 gap-3">

                    <p>
                        © {new Date().getFullYear()} <span className="text-gray-300 font-medium">Urbexon</span>. All rights reserved.
                    </p>

                    <p>Made in India 🇮🇳</p>

                    <p>
                        Crafted by <span className="text-indigo-400">Dhananjay</span>
                    </p>

                </div>
            </div>
        </footer>
    );
};

export default Footer;