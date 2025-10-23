import React from 'react';
import Avatar from './Avatar';

const AboutScreen: React.FC = () => {
  const founderName = "Ajia Abdulrasaq";
  return (
    <div className="bg-white p-6 md:p-8 rounded-lg shadow-lg max-w-3xl mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-extrabold text-gray-900">A Note from the Founder</h1>
      </div>

      <div className="flex flex-col md:flex-row items-center mb-8">
        <Avatar name={founderName} size="2xl" className="mb-4 md:mb-0 md:mr-6 shadow-md" />
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{founderName}</h2>
          <p className="text-md text-gray-500">Ilorin, Kwara State, Nigeria</p>
        </div>
      </div>

      <div className="prose prose-lg max-w-none text-gray-700 space-y-4">
        <p>
          I’ve always loved connecting with people, sharing ideas, and building meaningful relationships — and that’s exactly why I created this app.
        </p>
        <p>
          I believe social media should be more than just posts and likes — it should bring people together, inspire creativity, and create real connections. My goal is to make this space a community where everyone feels free to express themselves and be heard.
        </p>
        <p>
          Thanks for joining me on this journey — let’s make something amazing together! 💫
        </p>
      </div>
    </div>
  );
};

export default AboutScreen;