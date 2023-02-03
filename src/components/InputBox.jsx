export function InputBox({inputType, amount, inputPlaceholder, onInputFunction}) {
  return ( 
    <input
      className="appearance-none h-4 pl-4 w-full m-0 pt-6 pb-6 border border-[#93939328] rounded-xl bg-[#93939328] outline-none text-sm"
      type={inputType}
      value={amount}
      placeholder={inputPlaceholder}
      onInput={onInputFunction}
    />
 );
}
