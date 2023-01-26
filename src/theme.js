// Tried to make a theme that copied the github iOS app's code viewer
// But it didn't turn out so well, so just leaving this here for historical purposes.
// We'll probably add a theme switching option in the future.
export const headerColor='bg-[#1C1D20]'
export const siteBackgroundColor='bg-[#151515]'
export const keywordColor=`text-[#67D1E8]`
export const functionNameColor=`text-[#6FCC76]`;
export const titleColor="text-[#4B8DF7]"
export const modiferColor=`text-[#7CD1E3]`;
export const paranthesisColor=`text-[#EF9860]`
export const stateMutabilityColor=`text-[#EA6B8D]`
export const parameterTypeColor=modiferColor;
export const parameterNameColor=paranthesisColor;
export const commaColor=`text-[#8A888E]`
export const buttonBackgroundColor=`bg-[#0E76FD]`
export const buttonTextColor=`text-[#FFFFF]`

export const plainSubtitleStyle = `text-xl tracking-tighter text-left font-bold`;
export const plainTitleStyle = `text-3xl tracking-tighter text-left font-bold `;

// export const coloredTitleStyle = `${plainTitleStyle} ${functionColor}`

export const subheading= "text-md";

export const keywordStylePlain=`inline text-lg font-bold mt-2`
export const paranthesisStyle=`inline text-lg font-bold ${paranthesisColor}`

export const stateMutabilityStyle=`${keywordStylePlain} ${stateMutabilityColor}`

export const keywordStyleColored=`${keywordStylePlain} ${keywordColor}`
export const keywordStyleColoredTitle=`${plainTitleStyle} ${keywordColor} mr-1`

export const commaStyle=`${keywordStylePlain} ${commaColor}`;
export const parameterTypeStyle=`${keywordStylePlain} ${parameterTypeColor}`;
export const parameterNameStyle=`${keywordStylePlain} ${parameterNameColor}`;

export const functionStyleColored=`${keywordStylePlain} ${functionNameColor}`;
export const functionModiferStyle=`${keywordStylePlain} ${keywordColor}`
