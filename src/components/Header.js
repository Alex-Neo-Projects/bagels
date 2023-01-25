import { headerColor, siteBackgroundColor } from '../githubTheme'
import '../styles/globals.css'

export default function Header(props) {
  return (
    <div className={`flex flex-col min-h-screen justify-start items-center ${siteBackgroundColor} font-['Supreme-Regular']`}>
      <div className={`flex items-center fixed ${headerColor} border-[#333333] h-14 top-0 left-0 right-0`}>
        <div className="mx-auto ">
          <p className="text-2xl text-[#ffffff] font-bold">
            Bagels 🥯
          </p>
        </div>
        <button className='absolute right-0' onClick={() => alert('Network switcher coming... someday. \n\nNeed it sooner? Let Alex or Neo know on discord or github issues!')}>
          <div className="bg-[#93939328] flex items-center rounded-xl h-10 p-4 mr-4">
            <div className='rounded-2xl p-1 bg-[#48B147] mr-1'></div>
            <p className='text-[#ffffff] text-sm'>localhost:8545</p>
          </div>
        </button>
      </div>

      <div className="pt-20 p-3 pb-2 overflow-auto no-scrollbar">
        {props.children}
      </div>
    </div>
  )
}
