import React, { useState } from 'react';
import SingleChoiceQuestion from './SingleChoiceQuestion';
import MultipleInputsQuestion from './MultipleInputsQuestion';
import MultipleChoiceQuestion from './MultipleChoiceQuestion';
import ConsultationQuestion from './ConsultationQuestion';
import { sendDataToGHL } from './api';
import { isPossiblePhoneNumber } from 'react-phone-number-input';
import { ReactComponent as USPIcon } from './assets/icons/uspicon.svg';

function Questionnaire() {
  const [questionnaire, setQuestionnaire] = useState([
    {
      id: 1,
      type: 'multiple-choice',
      question: 'What are your main goals?',
      options: [
        'Lose weight',
        'Reduce stubborn fat',
        'Build muscle & tone',
        'Tighten loose skin',
        'Reduce cellulite',
        'Reduce bloating',
      ],
      answer: '',
    },
    {
      id: 2,
      type: 'multiple-choice',
      question: 'Which areas concern you most?',
      options: [
        'Abdomen',
        'Love handles',
        'Arms',
        'Thighs',
        'Double chin',
        'Glutes',
        'Knees',
        'Back',
      ],
      answer: '',
    },
    {
      id: 3,
      type: 'single-choice',
      question: 'What is your timeline for results?',
      options: ['As soon as possible', '3-4 months', '6+ months', 'I am flexible'],
      answer: '',
    },
    {
      id: 4,
      type: 'single-choice',
      question: 'Are you open to prescription weight loss medication?',
      description: '(e.g. Ozempic, Mounjaro)',
      options: ['Yes, I am interested', 'No, I prefer non-medical', 'Not sure, I would like advice'],
      answer: '',
    },
    {
      id: 5,
      type: 'single-choice',
      question: 'Have you tried losing weight before?',
      options: [
        'Yes, but struggled to keep it off',
        'Yes, with some success',
        'No, this is my first attempt',
        'I have tried many things without lasting results',
      ],
      answer: '',
    },
    {
      id: 6,
      type: 'single-choice',
      question: 'Where did you hear about us?',
      options: ['Social Media', 'Google', 'Hotel', 'Company partnership', 'Influencer', 'Family/Friend', 'Repeat customer', 'Other'],
      answer: '',
    },
    {
      id: 7,
      type: 'consultation-question',
      question: '',
      description: 'For a limited time we are offering free virtual consultations with qualified medical professionals to discuss your weight loss goals and the personalised treatment options available to you.',
      options: ['Free virtual consult', 'In person consult (50 euros)', 'No consultation'],
      answer: '',
    },
    {
      id: 8,
      type: 'multiple-inputs',
      question: '',
      answer: { first_name: '', surname: '', email: '', phone: '' },
    },
  ]);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [error, setError] = useState(null);

  const validateEmail = (email) => {
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
  };

  const handleSubmit = () => {
    const lastIndex = questionnaire.length - 1;
    if (![6, 7].includes(currentQuestionIndex) && !questionnaire[currentQuestionIndex].answer[0]) {
      setError('Please select an answer and try again');
      return;
    } else {
      setError(null);
    }
    if (currentQuestionIndex === lastIndex) {
      if (!validateEmail(questionnaire[lastIndex].answer.email)) {
        setError('Please enter a valid email address.');
        return;
      }
      if (!isPossiblePhoneNumber(questionnaire[lastIndex].answer.phone || '')) {
        setError('Please enter a valid phone number.');
        return;
      }
      if (!questionnaire[lastIndex].answer.first_name || !questionnaire[lastIndex].answer.surname) {
        setError('Please enter your name.');
        return;
      }
    }
    if (currentQuestionIndex === 6 && questionnaire[6].answer === 'No consultation') {
      storeAndRedirect();
    } else if (currentQuestionIndex < questionnaire.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      storeAndRedirect();
    }
  };

  const storeAndRedirect = async () => {
    const answers = questionnaire.map((q) => q.answer);
    localStorage.setItem('questionnaireData', JSON.stringify(answers));
    await sendDataToGHL(answers);
    window.top.location.href = 'https://slimming-seven.vercel.app/thank-you';
  };

  const handleAnswerChange = (id, value) => {
    setQuestionnaire((prev) =>
      prev.map((q) => (q.id === id ? { ...q, answer: value } : q))
    );
  };

  const handleBackButtonClick = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  function renderQuestionComponent(question) {
    switch (question.type) {
      case 'single-choice':
        return (
          <SingleChoiceQuestion question={question} options={question.options} setAnswer={handleAnswerChange} setError={setError} />
        );
      case 'multiple-choice':
        return (
          <MultipleChoiceQuestion question={question} options={question.options} setAnswer={handleAnswerChange} setError={setError} />
        );
      case 'multiple-inputs':
        return (
          <MultipleInputsQuestion className="text-left" question={question} options={question.options} setAnswer={handleAnswerChange} setError={setError} consultType={questionnaire[6].answer} />
        );
      case 'consultation-question':
        return (
          <ConsultationQuestion question={question} options={question.options} setAnswer={handleAnswerChange} setError={setError} />
        );
      default:
        return null;
    }
  }

  function getbuttonClass(answer) {
    const isArrayCondition = Array.isArray(answer) && answer.length !== 0;
    const objectCondition = typeof answer === 'object' && !Array.isArray(answer) && Object.values(answer).every(field => field !== '');
    if (typeof answer === 'string' && answer !== '') return 'custom-button-color-ready';
    if (isArrayCondition) return 'custom-button-color-ready';
    if (objectCondition) return 'custom-button-color-ready';
    return 'custom-button-color';
  }

  return (
    <div className="min-h-screen flex items-start justify-center lg:pt-8">
      <div className='w-full lg:w-1/2'>
        <div className="min-h-screen p-1 lg:min-h-0 w-full mx-auto">
          <h2 className="text-left mb-4 mt-4 font-custom font-thin custom-text-color w-full">
            {questionnaire[currentQuestionIndex].question}
          </h2>
          {questionnaire[currentQuestionIndex].description ?
            <div className="flex items-center justify-center mb-6">
              <p className="text-sm custom-text-color font-light text-justify mb-2 font-roboto">{questionnaire[currentQuestionIndex].description}</p>
            </div>
            : null
          }
          <div className="space-y-4">
            {renderQuestionComponent(questionnaire[currentQuestionIndex])}
            {error && <p className="custom-text-color">{error}</p>}
            <div className="flex justify-between">
              {currentQuestionIndex > 0 && (
                <button onClick={handleBackButtonClick} className="sm:static sm:ml-0 sm:mb-0 custom-border-color h-12 custom-text-color font-custom py-2 px-6 text-sm mr-4 mb-4 whitespace-nowrap">
                  &larr; Back
                </button>
              )}
              <button className={`${getbuttonClass(questionnaire[currentQuestionIndex].answer)} sm:static sm:mr-0 sm:mb-0 w-full py-2 h-12 font-custom`} onClick={handleSubmit}>
                {currentQuestionIndex === questionnaire.length - 1 ? 'Submit' : 'Next'}
              </button>
            </div>
          </div>
          <div className="flex justify-start items-center">
            <USPIcon className='h-20 mt-12'></USPIcon>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Questionnaire;
