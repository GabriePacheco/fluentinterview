import Logo from "../Logo";
import { useAuth } from "../../context/authContext";
import { Link } from "react-router-dom";
import { FaPowerOff } from "react-icons/fa";
import { useState, useEffect, useRef } from "react";

const Nav = () => {
    const { user, logOuth } = useAuth();
    const [open, setOpen] = useState(false);
    const menuRef = useRef(null);

    // Cerrar el menú si se hace clic fuera de él
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [menuRef]);

    return (
        <nav className="fixed top-0 left-0 w-full">
            <div className="w-full flex p-3 justify-between items-center">
                <Link to="/app">
                    <Logo />
                </Link>
                <div className="text-end relative" ref={menuRef}>
                    <button
                        onClick={() => setOpen((open) => !open)}
                        className="rounded-full w-8 h-8 overflow-hidden"
                    >
                        <img src={user.photoURL} className="object-cover" />
                    </button>
                    {open && (
                        <div className="absolute w-[250px] bottom-0 top-6 right-2 shadow">
                            <ul className="w-full bg-white border rounded-lg p-1 text-start text-xs">
                                <li className="w-full h-full hover:bg-normal hover:rounded">
                                    <Link
                                        to="/app/profile"
                                        onClick={() => setOpen(false)}
                                        className="w-full flex justify-start h-full items-center px-2 py-4"
                                    >
                                        <strong>{user.displayName}</strong>
                                    </Link>
                                </li>
                                <hr />
                                <li className="w-full h-full hover:bg-normal hover:rounded">
                                    <button
                                        onClick={() => logOuth()}
                                        className="w-full flex justify-start h-full items-center px-2 py-4 gap-2"
                                    >
                                        <FaPowerOff /> <span>Log Out</span>
                                    </button>
                                </li>
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Nav;
