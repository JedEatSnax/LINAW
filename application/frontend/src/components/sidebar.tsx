"use client";
import logo from "../assets/react.svg"
import { useState } from 'react';
import { MdMenuOpen } from "react-icons/md";
import { IoHomeOutline } from "react-icons/io5";
import { FaProductHunt } from "react-icons/fa";
import { FaUserCircle } from "react-icons/fa";
import { TbReportSearch } from "react-icons/tb";
import { IoLogoBuffer } from "react-icons/io";
import { CiSettings } from "react-icons/ci";
import { MdOutlineDashboard } from "react-icons/md";

const menuItems = [
  {
    icons: <IoHomeOutline size={25} />,
    label: 'Dashboard'
  },
  {
    icons: <FaProductHunt size={25} />,
    label: 'Products'
  },
  {
    icons: <MdOutlineDashboard size={25} />,
    label: 'Dashboard'
  },
  {
    icons: <CiSettings size={25} />,
    label: 'Setting'
  },
  {
    icons: <IoLogoBuffer size={25} />,
    label: 'Log'
  },
  {
    icons: <TbReportSearch size={25} />,
    label: 'Report'
  }
]

export default function Sidebar() {

  const [open, setOpen] = useState(true)

  return (
    <nav className={`shadow-md h-screen p-2 flex flex-col duration-500 bg-gray-950 text-white ${open ? 'w-60' : 'w-16'} border-r border-gray-700`}>

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
              <li key={index} className='px-3 py-2 my-2 rounded-md hover:bg-amber-700 duration-300 cursor-pointer flex gap-2 items-center relative group'>
                <div>{item.icons}</div>
                <p className={`font-ibm-sans ${!open && 'w-0 translate-x-24'} duration-500 overflow-hidden`}>
                  {item.label}
                </p>
                <p className={`font-ibm-sans ${open && 'hidden'} absolute left-32 shadow-md rounded-md
                  w-0 p-0 text-black bg-white duration-100 overflow-hidden group-hover:w-fit group-hover:p-2 group-hover:left-16
                `}>
                  {item.label}
                </p>
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