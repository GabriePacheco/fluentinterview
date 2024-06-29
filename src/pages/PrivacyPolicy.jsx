import React from 'react';
import Nav from '../components/Nav';

const PrivacyPolicy = () => {
    return (
        <>
            <Nav />
            <div className="container mx-auto pt-16">
                <div className="privacy-policy">
                    <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>

                    <p>Welcome to Fluent Interview. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our application and services. By accessing or using our app, you agree to the terms of this Privacy Policy.</p>

                    <h2 className="text-2xl font-bold mt-6 mb-2">Information We Collect</h2>
                    <p>We may collect the following information:</p>
                    <ul className="list-disc list-inside ml-6">
                        <li>Personal Information: Name, email address, profile picture.</li>
                        <li>Usage Data: Interaction with the app, time, and duration of use.</li>
                        <li>Device Information: IP address, browser type, operating system.</li>
                    </ul>

                    <h2 className="text-2xl font-bold mt-6 mb-2">How We Use Your Information</h2>
                    <p>We use the information to:</p>
                    <ul className="list-disc list-inside ml-6">
                        <li>Provide and maintain our app.</li>
                        <li>Improve and personalize the app.</li>
                        <li>Understand how you use the app.</li>
                        <li>Communicate with you.</li>
                        <li>Process transactions.</li>
                        <li>Prevent fraud.</li>
                    </ul>

                    <h2 className="text-2xl font-bold mt-6 mb-2">Sharing Your Information</h2>
                    <p>We may share your information with:</p>
                    <ul className="list-disc list-inside ml-6">
                        <li>Service providers to perform services on our behalf.</li>
                        <li>Affiliates with your consent.</li>
                        <li>During business transfers.</li>
                        <li>To comply with legal obligations.</li>
                    </ul>

                    <h2 className="text-2xl font-bold mt-6 mb-2">Your Data Protection Rights</h2>
                    <p>You have the right to:</p>
                    <ul className="list-disc list-inside ml-6">
                        <li>Access your personal data.</li>
                        <li>Request correction of inaccurate data.</li>
                        <li>Request deletion of your data.</li>
                        <li>Object to processing of your data.</li>
                    </ul>

                    <h2 className="text-2xl font-bold mt-6 mb-2">Contact Us</h2>
                    <p>If you have any questions about this Privacy Policy, please contact us at support@fluentinterview.com.</p>

                    <p className="mt-6"><strong>Effective Date:</strong> [Insert Date]</p>
                </div>
            </div>
        </>
    );
};

export default PrivacyPolicy;
