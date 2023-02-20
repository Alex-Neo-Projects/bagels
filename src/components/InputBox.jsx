export function InputBox({value, inputType, inputPlaceholder, onInputFunction}) {
  return ( 
    <input
      className="appearance-none h-4 w-full m-0 p-4 pt-6 pb-6 border border-[#93939328] rounded-xl bg-[#93939328] outline-none text-sm"
      type={inputType}
      placeholder={inputPlaceholder}
      onInput={onInputFunction}
      value={value}
    />
 );
}
