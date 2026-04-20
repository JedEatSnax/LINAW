import logo from "../assets/react.svg";
import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { MdMenuOpen } from "react-icons/md";
import { IoHomeOutline } from "react-icons/io5";
import { TfiWrite } from "react-icons/tfi";
import { FaUserCircle } from "react-icons/fa";
import { IoIosSettings } from "react-icons/io";
import { GrHistory } from "react-icons/gr";
import { VscOrganization } from "react-icons/vsc";

const menuItems = [
  {
    icons: <IoHomeOutline size={25} />,
    label: "Dashboard",
    to: "/dashboard",
  },
  {
    icons: <VscOrganization size={25} />,
    label: "Organizations",
    to: "/organizations",
  },
  {
    icons: <TfiWrite size={22.5} />,
    label: "Assets",
    to: "/assets",
  },
  {
    icons: <GrHistory size={23} />,
    label: "History",
    to: "/history",
  },
  {
    icons: <IoIosSettings size={25} />,
    label: "Settings",
    to: "/settings",
  },
];

export default function Sidebar() {
  const [open, setOpen] = useState(true);
  const [userEmail, setUserEmail] = useState("Not signed in");
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserEmail(user?.email ?? "Not signed in");
    });

    return () => unsubscribe();
  }, [auth]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login", { replace: true });
  };

  const handleProfileClick = () => {
    if (!auth.currentUser) {
      navigate("/login", { replace: true });
      return;
    }

    navigate("/settings");
  };

  return (
    <nav
      className={`shadow-md h-full min-h-0 p-2 flex flex-col duration-500 bg-zinc-950 text-slate-300 ${open ? "w-60" : "w-16"} border-r border-slate-500`}
    >
      {/* Header */}
      <div className="h-20 px-3 py-2 flex items-center justify-between border-b border-slate-800/80">
        <div className="flex min-w-0 items-center gap-3 overflow-hidden">
          <img
            src={logo}
            alt="Logo"
            className={`rounded-md transition-all duration-300 ${open ? "w-7 opacity-100" : "w-0 opacity-0"}`}
          />
          <div
            className={`leading-tight whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${
              open ? "max-w-24 opacity-100" : "max-w-0 opacity-0"
            }`}
          >
            <p className="text-sm font-semibold tracking-wide text-slate-100">
              LINAW
            </p>
            <p className="text-xs text-slate-500">v1.0.0</p>
          </div>
        </div>

        <button
          type="button"
          aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
          onClick={() => setOpen(!open)}
          className="rounded p-1 text-slate-400 transition-colors hover:text-white"
        >
          <MdMenuOpen
            size={27}
            className={`transition-transform duration-500 ${!open && "rotate-180"}`}
          />
        </button>
      </div>

      {/* Body */}

      <ul className="flex-1">
        {menuItems.map((item, index) => {
          return (
            <li key={index}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `px-3 py-2 my-2 rounded-md duration-300 cursor-pointer flex gap-2 items-center relative group ${
                    isActive
                      ? "bg-slate-800/80 text-white font-semibold"
                      : "hover:bg-slate-800/80 hover:text-white"
                  }`
                }
              >
                <div>{item.icons}</div>
                <p
                  className={`${!open && "w-0 translate-x-24"} duration-500 overflow-hidden`}
                >
                  {item.label}
                </p>
                <p
                  className={`${open && "hidden"} absolute left-32 shadow-md rounded-md
                    w-0 p-0 text-black bg-white duration-100 overflow-hidden group-hover:w-fit group-hover:p-2 group-hover:left-16
                  `}
                >
                  {item.label}
                </p>
              </NavLink>
            </li>
          );
        })}
      </ul>
      {/* footer */}
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          type="button"
          onClick={handleProfileClick}
          aria-label="Go to settings"
          className="rounded text-slate-300 transition-colors hover:text-white"
        >
          <FaUserCircle size={30} />
        </button>

        <div
          className={`leading-5 overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out ${
            open
              ? "max-w-44 opacity-100 translate-x-0"
              : "max-w-0 opacity-0 translate-x-3"
          }`}
        >
          <p>Current User</p>
          <span className="text-xs">{userEmail}</span>
        </div>
      </div>

      <div className={`${open ? "px-3 pb-2" : "hidden"}`}>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full rounded bg-slate-800 px-3 py-2 text-sm text-slate-200 hover:bg-slate-700"
        >
          Sign Out
        </button>
      </div>
    </nav>
  );
}
