
import Nav from '../components/Nav'

const Terms = () => {
    return (
        <div className="w-full h-full min-h-full pt-12">
            <Nav />
            <div className='pt-10 container mx-auto overflow-y-hidden scroll-m-0'>
                <div className="terms-and-conditions p-6">
                    <h1 className="text-3xl font-bold mb-4">Terms and Conditions</h1>

                    <p>Welcome to Fluent Interview. These Terms and Conditions govern your use of our application and services. By accessing or using our app, you agree to comply with and be bound by these terms. If you do not agree to these terms, please do not use our app.</p>

                    <h2 className="text-2xl font-bold mt-6 mb-2">Use of the Application</h2>
                    <ul className="list-disc list-inside">
                        <li>
                            <strong>Eligibility:</strong> You must be at least 18 years old to use this app. By using the app, you represent and warrant that you meet this requirement.
                        </li>
                        <li>
                            <strong>Account Registration:</strong> To access certain features, you must create an account. You agree to provide accurate and complete information during registration and to keep this information up to date.
                        </li>
                        <li>
                            <strong>User Conduct:</strong> You agree not to use the app for any unlawful purpose or in any way that could harm our app or services. Prohibited activities include, but are not limited to:
                            <ul className="list-disc list-inside ml-6">
                                <li>Violating any applicable laws or regulations.</li>
                                <li>Infringing upon or violating our intellectual property rights or the intellectual property rights of others.</li>
                                <li>Transmitting any harmful or malicious code.</li>
                                <li>Interfering with or disrupting the integrity or performance of the app.</li>
                            </ul>
                        </li>
                    </ul>

                    <h2 className="text-2xl font-bold mt-6 mb-2">Privacy</h2>
                    <p>Your use of the app is also governed by our Privacy Policy, which outlines how we collect, use, and protect your personal information. By using the app, you agree to the terms of our Privacy Policy.</p>

                    <h2 className="text-2xl font-bold mt-6 mb-2">Intellectual Property</h2>
                    <p>All content, features, and functionality of the app, including but not limited to text, graphics, logos, icons, and images, are the exclusive property of Fluent Interview and are protected by international copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws.</p>

                    <h2 className="text-2xl font-bold mt-6 mb-2">Termination</h2>
                    <p>We reserve the right to terminate or suspend your account and access to the app, without prior notice or liability, for any reason, including if you breach these Terms and Conditions.</p>

                    <h2 className="text-2xl font-bold mt-6 mb-2">Limitation of Liability</h2>
                    <p>To the maximum extent permitted by law, Fluent Interview shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses, resulting from:</p>
                    <ul className="list-disc list-inside ml-6">
                        <li>Your use or inability to use the app.</li>
                        <li>Any unauthorized access to or use of our servers and/or any personal information stored therein.</li>
                        <li>Any interruption or cessation of transmission to or from the app.</li>
                        <li>Any bugs, viruses, trojan horses, or the like that may be transmitted to or through our app by any third party.</li>
                    </ul>

                    <h2 className="text-2xl font-bold mt-6 mb-2">Governing Law</h2>
                    <p>These Terms and Conditions are governed by and construed in accordance with the laws of [Your Country/State], without regard to its conflict of law principles.</p>

                    <h2 className="text-2xl font-bold mt-6 mb-2">Changes to Terms and Conditions</h2>
                    <p>We reserve the right, at our sole discretion, to modify or replace these Terms and Conditions at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect. Your continued use of the app after the effective date of the revised Terms and Conditions constitutes your acceptance of the terms.</p>

                    <h2 className="text-2xl font-bold mt-6 mb-2">Contact Us</h2>
                    <p>If you have any questions about these Terms and Conditions, please contact us at support@fluentinterview.com.</p>

                    <p className="mt-6"><strong>Effective Date:</strong> [Insert Date]</p>

                </div>

            </div>
        </div>
    )

}

export default Terms