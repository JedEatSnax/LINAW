"use-client";
>>>>>>> 6883f9a (Made components do client-side rendering.)

export const Sidebar = () => {
    return (
        <div className="fixed h-screen translate-y-12 w-64 bg-gray-800 p-4 shadow border-r border-slate-700">
            <div className="text-amber-500 font-bold">
                sidebar
            </div>
        </div>
      </div>

      <div className='px-3 pb-2'>
        <button
          type='button'
          onClick={handleLogout}
          className='w-full rounded bg-slate-800 px-3 py-2 text-sm font-ibm-sans text-slate-200 hover:bg-slate-700'
        >
          Sign Out
        </button>
      </div>


    </nav>
  )
}