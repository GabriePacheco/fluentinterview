import { useEffect, useState } from 'react'
import Range from '../../components/app/register/Range'
import NativeLanguage from '../../components/app/register/NativeLanguage'


const Register = () => {
    const [data, setData] = useState({
        nativeLanguage: null,
        englishLevel: null,
        carreers: null,
        avatar: null,
    })

    const [step, setStep] = useState(1)

    useEffect(() => {
        const checkStep = () => {

            if (!data.nativeLanguage) {
                setStep(1)
            } else if (!data.englishLevel) {
                setStep(2)
            } else if (!data.carreers) {
                setStep(3)
            } else if (!data.avatar) {
                setStep(4)
            }
        };
        checkStep();
    }, [data])

    const changeData = (change) => {
        setData({ ...data, ...change })
    }
    console.log(data)


    return (
        <div className='w-full h-full '>
            <div className='md:w-3/6 w-11/12  mx-auto min-h-3/4 fix'>

                <Range data={data} step={step} />

            </div>
            <div className='md:w-3/6 w-11/12 bg-white rounded-lg shadow p-8 mx-auto min-h-3/4 mt-5'>

                {step === 1 &&
                    <>
                        <h3 className='font-bold text-2xl text-center pt-10'>Welcome to FluentIntervie.</h3>
                        <NativeLanguage save={changeData} />
                    </>
                }
                {step === 2 && <div>English Level </div>}
                {step === 3 && <div>Careear</div>}
                {step === 4 && <div>Avatar </div>}

            </div>
        </div>
    )
}

export default Register