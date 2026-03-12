"use client";
import logo from "../assets/react.svg"
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { MdMenuOpen } from "react-icons/md";
import { IoHomeOutline } from "react-icons/io5";
import { HiOutlinePencilSquare } from "react-icons/hi2";
import { FaUserCircle } from "react-icons/fa";
import { TbReportSearch } from "react-icons/tb";
import { IoLogoBuffer } from "react-icons/io";
import { IoIosSettings } from "react-icons/io";
import { FaHistory } from "react-icons/fa";


const menuItems = [
  {
    icons: <IoHomeOutline size={25} />,
    label: 'Dashboard',
    to: '/dashboard'
  },
  {
    icons: <HiOutlinePencilSquare size={25} />,
    label: 'Query Ledger',
    to: '/query-ledger'
  },
  {
    icons: <IoLogoBuffer size={25} />,
    label: 'Submit Transaction',
    to: '/submit-transaction'
  },
  {
    icons: <TbReportSearch size={25} />,
    label: 'Chaincode Events',
    to: '/chaincode-events'
  },
  {
    icons: <FaHistory size={20} />,
    label: 'Transaction History',
    to: '/transaction-history'
  },
  {
    icons: <IoIosSettings size={25} />,
    label: 'Settings',
    to: '/settings'
  }
]


export default function Sidebar() {

  const [open, setOpen] = useState(true)

  return (
    <nav className={`shadow-md h-screen p-2 flex flex-col duration-500 bg-gray-950 text-slate-400 ${open ? 'w-60' : 'w-16'} border-r border-gray-700`}>

      {/* Header */}
      <div className=' px-3 py-2 h-20 flex justify-between items-center'>
        <img src={logo} alt="Logo" className={`${open ? 'w-10' : 'w-0'} rounded-md`} />
        <div><MdMenuOpen size={27} className={` duration-500 cursor-pointer ${!open && ' rotate-180'}`} onClick={() => setOpen(!open)} /></div>
      </div>

      {/* Body */}

      <ul className='flex-1'>
        {
          menuItems.map((item, index) => {
            return (
              <li key={index}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `relative group flex items-center gap-4 py-2 pl-4 pr-4 my-2 -mr-2 duration-300 cursor-pointer ${
                      isActive
                        ? 'bg-amber-700/20 text-amber-500 before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-amber-500'
                        : 'hover:bg-slate-900'
                    }`
                  }
                >
                  <div>{item.icons}</div>
                  <p className={`font-ibm-sans ${!open && 'w-0 translate-x-24'} duration-500 overflow-hidden`}>
                    {item.label}
                  </p>
                  <p className={`font-ibm-sans ${open && 'hidden'} absolute left-32 shadow-md rounded-md
                    w-0 p-0 text-black bg-white duration-100 overflow-hidden group-hover:w-fit group-hover:p-2 group-hover:left-16
                  `}>
                    {item.label}
                  </p>
                </NavLink>
              </li>
            )
          })
        }
      </ul>
      {/* footer */}
      <div className='flex items-center gap-2 px-3 py-2'>
        <div><FaUserCircle size={30} /></div>
        <div className={`leading-5 ${!open && 'w-0 translate-x-24'} duration-500 overflow-hidden`}>
          <p>sample</p>
          <span className='text-xs'>sample@gmail.com</span>

        </div>
      </div>


    </nav>
  )
}