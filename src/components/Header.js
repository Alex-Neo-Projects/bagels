import '../styles/globals.css'

export default function Header(props) {
  return (
    <div className="flex flex-col min-h-screen justify-center items-center bg-[#B3B3B3] font-['Supreme-Regular']">
      <div className="fixed bg-[#060606e6] backdrop-blur-xl border-b-[0.1px] border-[#333333] w-full h-14 flex flex-row justify-center items-center top-0 left-0 right-0">
        <div className="flex w-full justify-center pl-4">
          <p className="text-md text-[#ffffff] font-bold">
            Bagel 🥯
          </p>
        </div>
      </div>

      <div className="pt-20 p-3 pb-2 overflow-auto no-scrollbar justify-center items-center">
        {props.children}
      </div>
    </div>
  )
}
