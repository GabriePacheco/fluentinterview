

const Range = ({ step }) => {
    const getLabelClass = (currentStep) => {
        return currentStep === step ? 'font-bold text-purple-700' : '';
    };

    return (
        <div className="w-full -pt-1">
            <input
                type="range"
                min={1}
                max={4}
                value={step}
                className="w-full h-1/2 mb-6 bg-gray-200 rounded-lg appearance-none cursor-pointer range-sm dark:bg-gray-700"
                readOnly
            />
            <div className="w-full flex justify-between items-center text-xs relative -mt-2">
                <span className={`absolute start-0 ${getLabelClass(1)}`}>Native Language</span>
                <span className={`absolute start-1/3   ${getLabelClass(2)}`}>English Level</span>
                <span className={`absolute start-2/3  ${getLabelClass(3)}`}>Careear</span>
                <span className={`absolute end-0  ${getLabelClass(4)}`}>Avatar</span>
            </div>
        </div>
    );
};

export default Range;
