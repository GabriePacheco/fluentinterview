import { HiOutlineChatBubbleLeftRight } from "react-icons/hi2";

const Logo = () => {
    return (
        <div className="flex justify-start items-center gap-2">
            <div className="rounded-full p-1 border-1 border-transparent bg-gradient-to-r from-[#8C3CD7] to-[#5F44EC]">
                <div className="bg-white p-1 rounded-full">
                    <HiOutlineChatBubbleLeftRight className="text-2xl text-[#8C3CD7]" />
                </div>
            </div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#8C3CD7] to-[#5F44EC]">
                FluentInterview
            </h1>
        </div>
    );
}

export default Logo;
