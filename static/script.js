document.addEventListener("DOMContentLoaded", function() {

    let flashcards = [];
    let index = 0;
    let flipped = false;
    let score = 0;
    let quizIndex = 0;
    let quizScore = 0;

    // Normalize text: lowercase, remove punctuation, split into words sorted alphabetically
    function normalize(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s]/g, "")  // remove punctuation
            .split(/\s+/)             // split into words
            .filter(w => w.length > 0)
            .sort()                   // sort words alphabetically
            .join(" ");               // join back
    }



    // Fisher–Yates Shuffle
    function shuffleArray(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }

    document.getElementById("generateBtn").onclick = async function () {
        const text = document.getElementById("qaInput").value.trim();

        if (!text) {
            alert("Please enter some question-answer pairs!");
            return;
        }

        const response = await fetch("/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: text })
        });

        flashcards = await response.json();

        if (flashcards.length === 0) {
            alert("No valid flashcards found. Use 'Question - Answer' format.");
            return;
        }

        // Reset
        index = 0;
        flipped = false;
        score = 0;
        
        document.getElementById("progressContainer").classList.remove("hidden");
        updateProgress();


        document.getElementById("flashcardContainer").classList.remove("hidden");

        showFlashcard();
    };

    function showFlashcard() {
        const card = flashcards[index];
        document.getElementById("question").innerText = card.question;
        document.getElementById("answer").innerText = card.answer;

        // Reset flip when card changes
        document.getElementById("flashcard").style.transform = "rotateY(0deg)";
        flipped = false;
    }

    // Flip animation + score count
    document.getElementById("flipBtn").onclick = function () {
        const card = document.getElementById("flashcard");

        if (!flipped) {
            card.style.transform = "rotateY(180deg)";
            flipped = true;

            // Add score only on flipping to answer
            score++;
            updateProgress();

            

        } else {
            card.style.transform = "rotateY(0deg)";
            flipped = false;
        }
    };

    document.getElementById("nextBtn").onclick = function () {
        index = (index + 1) % flashcards.length;
        showFlashcard();
    };

    document.getElementById("prevBtn").onclick = function () {
        index = (index - 1 + flashcards.length) % flashcards.length;
        showFlashcard();
    };

    // Shuffle feature
    document.getElementById("shuffleBtn").onclick = function () {
        shuffleArray(flashcards);
        index = 0;
        showFlashcard();
    };
    
    function updateProgress() 
    {
    let progress = (score / flashcards.length) * 100;
    document.getElementById("progressBar").style.width = progress + "%";
    }

    document.getElementById("quizBtn").onclick = function() {
    quizIndex = 0;
    quizScore = 0;

    document.getElementById("quizAnswerInput").classList.remove("hidden");
    document.getElementById("submitQuizAnswer").classList.remove("hidden");

    document.getElementById("quizContainer").classList.remove("hidden");
    startQuiz();

    
    };
    function startQuiz() {
        const card = flashcards[quizIndex];
        document.getElementById("quizQuestion").innerText = "Q: " + card.question;

        document.getElementById("quizAnswerInput").value = "";
        document.getElementById("quizFeedback").innerText = "";
    }
    function similarity(a, b) {
    // Levenshtein distance similarity
    let longer = a.length > b.length ? a : b;
    let shorter = a.length > b.length ? b : a;

    let longerLength = longer.length;
    if (longerLength === 0) return 1.0;

    let editDist = levenshtein(longer, shorter);
    return (longerLength - editDist) / longerLength;
}

function levenshtein(a, b) {
    let matrix = [];

    let i, j;

    for (i = 0; i <= b.length; i++) matrix[i] = [i];
    for (j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (i = 1; i <= b.length; i++) {
        for (j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1,     // insertion
                    matrix[i - 1][j] + 1      // deletion
                );
            }
        }
    }

    return matrix[b.length][a.length];
}


    document.getElementById("submitQuizAnswer").onclick = function () {
    const userRaw = document.getElementById("quizAnswerInput").value.trim();
    const correctRaw = flashcards[quizIndex].answer.trim();

    // Normalize both for fair comparison
    const userAnswer = normalize(userRaw);
    const correctAnswer = normalize(correctRaw);

    const sim = similarity(userAnswer, correctAnswer);

    if (sim >= 0.7) {
        quizScore++;
        document.getElementById("quizFeedback").innerText =
            "Correct! ✔ (Similarity: " + Math.round(sim * 100) + "%)";
        document.getElementById("quizFeedback").style.color = "#00cc88";
    } else {
        document.getElementById("quizFeedback").innerText =
            "Wrong! ✘ Correct answer: " + correctRaw +
            " (Similarity: " + Math.round(sim * 100) + "%)";
        document.getElementById("quizFeedback").style.color = "red";
    }

    quizIndex++;

setTimeout(() => {
    if (quizIndex >= flashcards.length) {
        endQuiz();
    } else {
        startQuiz();
    }
}, 1200); // allows time to see feedback

    };


    
    function endQuiz() {
    document.getElementById("quizQuestion").innerText = "Quiz Finished!";
    document.getElementById("quizScore").innerText =
        "Your Score: " + quizScore + " / " + flashcards.length;

    // Hide input + submit button
    document.getElementById("quizAnswerInput").classList.add("hidden");
    document.getElementById("submitQuizAnswer").classList.add("hidden");

    // Clear feedback
    document.getElementById("quizFeedback").innerText = "";
}

});