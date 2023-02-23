export function OutputBox({output}) {
  return ( 
    <div className="flex flex-col pt-4 space-y-4 w-full">
      <p className="text-md font-bold">Transaction Successful</p>
      <div className="flex flex-row justify-start items-center space-x-4 w-full">
        <div className="flex flex-col w-full bg-[#93939328] border border-[#93939328] rounded-lg p-2 text-sm">
          {output.map((res, idx) => {
            return (
              <>
                <p
                  key={idx.toString()}
                  style={{ whiteSpace: "pre-line" }}
                  className="text-sm"
                >
                  {res}
                </p>
              </>
            );
          })}
        </div>
      </div>
    </div>
 );
}
