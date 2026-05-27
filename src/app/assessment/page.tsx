"use client";

import { useEffect, useState }
  from "react";

import { supabase }
  from "@/app/lib/supabase";

import { useRouter }
  from "next/navigation";

export default function AssessmentPage() {
  type CareerQuestion = {

    id: number;

    question_number: number;

    question_text: string;

    category: string;

    options: string[];
  };
  const router = useRouter();

  const [questions, setQuestions] =
    useState<CareerQuestion[]>([]);

  const [currentQuestion,
    setCurrentQuestion] =
    useState(0);

  const [answers, setAnswers] =
    useState<Record<number, string>>({});

  const [loading, setLoading] =
    useState(true);

  const [submitting,
    setSubmitting] =
    useState(false);

  // FETCH QUESTIONS

  useEffect(() => {

    const fetchQuestions =
      async () => {

        const {
          data,
          error,
        } = await supabase

          .from(
            "career_questions"
          )

          .select("*")

          .order(
            "question_number",
            {
              ascending: true,
            }
          )

          .limit(20);

        if (error) {

          console.error(error);

          return;
        }

        setQuestions(data || []);

        setLoading(false);
      };

    fetchQuestions();

  }, []);

  // HANDLE ANSWER

  const handleAnswer =
    (
      questionNumber: number,
      answer: string
    ) => {

      setAnswers({
        ...answers,

        [questionNumber]:
          answer,
      });
    };

  // NEXT QUESTION

  const handleNext = () => {

    if (
      currentQuestion <
      questions.length - 1
    ) {

      setCurrentQuestion(
        currentQuestion + 1
      );
    }
  };

  // PREVIOUS QUESTION

  const handlePrevious =
    () => {

      if (
        currentQuestion > 0
      ) {

        setCurrentQuestion(
          currentQuestion - 1
        );
      }
    };

  // SUBMIT ASSESSMENT

  const handleSubmit =
    async () => {

      try {

        setSubmitting(true);

        const {
          data: { user },
        } = await supabase.auth
          .getUser();

        if (!user) {

          alert(
            "User not found"
          );

          return;
        }

        // CREATE ASSESSMENT

        const {
          data: assessment,
          error:
          assessmentError,
        } = await supabase

          .from(
            "career_assessments"
          )

          .insert([
            {
              user_email:
                user.email,

              recommendation:
                "Career analysis generated successfully",
            },
          ])

          .select()

          .single();

        if (
          assessmentError
        ) {

          console.log(
            "Assessment Insert Error:",
            JSON.stringify(
              assessmentError,
              null,
              2
            )
          );

          return;
        }

        // SAVE ANSWERS

        const answersPayload =
          questions.map((q: CareerQuestion) => ({

            assessment_id:
              assessment.id,

            user_email:
              user.email,

            question_number:
              q.question_number,

            question_text:
              q.question_text,

            selected_answer:
              answers[
              q.question_number
              ] || "",

            category:
              q.category,
          }));

        const {
          error: answersError,
        } = await supabase

          .from(
            "career_answers"
          )

          .insert(
            answersPayload
          );

        if (
          answersError
        ) {

          console.log(
            "Answers Insert Error:",
            JSON.stringify(
              answersError,
              null,
              2
            )
          );

          return;
        }

        alert(
          "Assessment Submitted Successfully"
        );

        console.log(
          "Redirecting Dashboard"
        );

        window.location.href =
          "/dashboard";

      } catch (error) {

        console.error(error);

      } finally {

        setSubmitting(false);
      }
    };

  // LOADING

  if (loading) {

    return (

      <div className="min-h-screen flex items-center justify-center text-3xl font-bold">

        Loading Questions...

      </div>
    );
  }

  const question =
    questions[currentQuestion];

  return (

    <main className="min-h-screen bg-[#f5f5f5] p-8">

      <div className="max-w-4xl mx-auto bg-white rounded-[32px] shadow-lg p-10">

        {/* TOP BAR */}

        <div className="flex items-center justify-between">

          <div>

            <h1 className="text-4xl font-black text-red-600">

              Career Assessment

            </h1>

            <p className="mt-2 text-gray-500">

              Question {
                currentQuestion + 1
              } of {
                questions.length
              }

            </p>

          </div>

          <button
            onClick={() =>
              router.push(
                "/dashboard"
              )
            }
            className="bg-gray-800 text-white px-5 py-3 rounded-2xl"
          >

            Dashboard

          </button>

        </div>

        {/* PROGRESS */}

        <div className="mt-8 w-full bg-gray-200 h-3 rounded-full overflow-hidden">

          <div
            className="bg-red-600 h-3"

            style={{
              width: `${(
                (currentQuestion + 1) /
                questions.length
              ) * 100
                }%`,
            }}
          />

        </div>

        {/* QUESTION */}

        <div className="mt-12">

          <h2 className="text-3xl font-bold leading-relaxed">

            {
              question.question_text
            }

          </h2>

          <p className="mt-3 text-gray-500">

            Category:
            {" "}
            {question.category}

          </p>

        </div>

        {/* OPTIONS */}

        <div className="mt-10 space-y-5">

          {question.options.map(
            (
              option: string,
              index: number
            ) => (

              <button
                key={index}

                onClick={() =>
                  handleAnswer(
                    question.question_number,
                    option
                  )
                }

                className={`w-full text-left p-5 rounded-2xl border-2 transition

                ${answers[
                    question.question_number
                  ] === option

                    ? "border-red-600 bg-red-50"

                    : "border-gray-200 hover:border-red-400"
                  }`}
              >

                {option}

              </button>
            )
          )}

        </div>

        {/* NAVIGATION */}

        <div className="mt-12 flex items-center justify-between">

          <button

            onClick={
              handlePrevious
            }

            disabled={
              currentQuestion === 0
            }

            className="bg-gray-300 px-6 py-3 rounded-2xl disabled:opacity-50"
          >

            Previous

          </button>

          {
            currentQuestion ===
              questions.length - 1

              ? (

                <button
                  onClick={
                    handleSubmit
                  }

                  disabled={
                    submitting
                  }

                  className="bg-red-600 text-white px-8 py-3 rounded-2xl"
                >

                  {
                    submitting

                      ? "Submitting..."

                      : "Submit Assessment"
                  }

                </button>

              ) : (

                <button
                  onClick={
                    handleNext
                  }

                  className="bg-red-600 text-white px-8 py-3 rounded-2xl"
                >

                  Next

                </button>
              )
          }

        </div>

      </div>

    </main>
  );
}