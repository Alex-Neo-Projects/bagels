import { buttonBackgroundColor, headerColor, siteBackgroundColor } from '../theme'
import '../styles/globals.css'
import { Link, useLocation } from 'wouter'

export default function Header(props) {
  const [location, setLocation] = useLocation();

  console.log(location); 

  return (
    <div className={`flex flex-col min-h-screen w-screen justify-start items-center ${siteBackgroundColor} font-['Supreme-Regular']`}>
      <div className={`flex items-center fixed ${headerColor} border-[#333333] h-14 top-0 left-0 right-0`}>
        <Link href="/">
          <div className="mx-auto hover:cursor-grab">
            <p className="text-2xl text-[#ffffff] font-bold">
              Bagels 🥯
            </p>
          </div>
        </Link>
        
        <button className='absolute right-0' onClick={() => alert('Network switcher coming... someday. \n\nNeed it sooner? Let Alex or Neo know on discord or github issues!')}>
          <div className="bg-[#93939328] flex items-center rounded-xl h-10 p-4 mr-4">
            <div className='rounded-2xl p-1 bg-[#48B147] mr-1'></div>
            <p className='text-[#ffffff] text-sm'>localhost:8545</p>
          </div>
        </button>

        {location !== '/' && (
          <div className="absolute left-0 p-4">
            <Link href="/">
              <button className={`bg-[#93939328] flex items-center rounded-xl h-10 p-4 mr-4 hover:cursor-grab hover:${buttonBackgroundColor}`}>
                <div className="flex flex-row justify-center w-full items-center  font-white font-bold">
                  <p className='text-[#ffffff] text-sm'>Back</p>
                </div>
              </button>
            </Link>
          </div>
        )}
      </div>

      <div className="pt-20 w-screen pl-2 pr-2 overflow-auto no-scrollbar">
        {props.children}
      </div>
    </div>
  )
}
