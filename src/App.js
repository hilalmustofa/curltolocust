import React, { useState, useRef, useEffect } from "react";
import parse from "@bany/curl-to-json";
import "./bulma.min.css";
import "./App.css";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { a11yDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { CopyToClipboard } from "react-copy-to-clipboard";
import Confetti from "react-confetti";
import curllocust from "./curllocust.png";
import "animate.css";
import FlyingText from "./FlyingText";
import "@fortawesome/fontawesome-free/css/all.min.css";

function App() {
  const [curlInput, setCurlInput] = useState("");
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const buttonRef = useRef(null);
  const [showFlyingText, setShowFlyingText] = useState(false);

  const handleInputChange = (event) => {
    setCurlInput(event.target.value);
  };

  const handleClearInput = () => {
    setCurlInput(""); 
  };

  const handleFlyingTextComplete = () => {
    setShowFlyingText(false);
  };

  const handleCopy = () => {
    setCopied(true);
  };

  const convertCurlToLocust = () => {
    try {
      if (curlInput.trim().indexOf(" ") === -1) {
        throw new Error("Bukan cURL njir");
      }
      const result = parse(curlInput);
      let requestMethod;
        if ((result.form && result.method === "GET") || (result.data && result.method === "GET")) {
          requestMethod = "post";
        } else if ((result.form && result.method !== "GET") || (result.data && result.method !== "GET")) {
          requestMethod = result.method.toLowerCase();
        } else {
            requestMethod = "get";
        }

        let fullUrl = result.location === true ? result.url : result.location;
        if (!fullUrl) {
            throw new Error("Invalid URL njir");
        }

        const url = new URL(fullUrl);
        const locustPath = `'${url.pathname}${url.search}'`;

        const headers = result.header
            ? Object.entries(result.header).map(([key, value]) => `"${key}": "${value}"`).join(",\n            ")
            : `"Content-Type": "application/json"`;

        let formData = result.form && Array.isArray(result.form) ? result.form : null;
        let dataField = result.data ? JSON.stringify(result.data, null, 2) : "";

        let locustCode = `from locust import HttpUser, task\nimport json\nfrom faker import Faker\nimport random\nimport uuid\n\nclass RequestName(HttpUser):\n    fake = Faker()\n    @task\n    def request_name(self):\n\n        #randomized_data_snippets\n        #name = self.fake.name()\n        #email = "random_email_testing" + str(random.randint(1000, 99999)) + "@yopmail.com"\n        #phone = "+628500002" + str(random.randint(1000, 99999))\n        #nik = "347216181933" + str(random.randint(1000, 9999))\n        #uuid = uuid.uuid4()\n\n        #headers\n        headers = {\n            ${headers}\n        }\n\n`;

        if (formData) {
            let formFields = [];
            let fileUploads = [];

            formData.forEach((field) => {
                const [key, value] = field.split("=");
                if (value.startsWith('@')) {
                    const filePath = value.slice(1);
                    fileUploads.push(`'${key}': open(${filePath}, 'rb')`);
                } else {
                    formFields.push(`'${key}': '${value.replace(/^"(.*)"$/, "$1")}'`);
                }
            });

            locustCode += `        #payload\n        body = {\n            ${formFields.join(",\n            ")}\n        }\n\n`;

            if (fileUploads.length > 0) {
                locustCode += `        #files\n        files = {\n            ${fileUploads.join(",\n            ")}\n        }\n\n`;
                locustCode += `        #send_request\n        response = self.client.${requestMethod}(${locustPath}, headers=headers, data=body, files=files)\n\n`;
            } else {
                locustCode += `        #send_request\n        response = self.client.${requestMethod}(${locustPath}, headers=headers, data=body)\n\n`;
            }
        } else {
            locustCode += `        #payload\n        body = ${dataField || "{ }"}\n`;
            locustCode += `        #send_request\n        response = self.client.${requestMethod}(${locustPath}, headers=headers, data=json.dumps(body))\n\n`;
        }

        locustCode += `        #read_response\n        print(f"{response.status_code} - {response.text}")`;

        const locustTemplate = `${locustCode}\n\n# Run Locust\n# locust -f yourscriptname.py`;

        setOutput(locustTemplate);
        setCopied(false);
        setShowConfetti(true);
        if (localStorage.getItem("hasShownFlyingText") === "true") {
            setShowFlyingText(false);
        } else {
            setShowFlyingText(true);
            localStorage.setItem("hasShownFlyingText", "true");
        }
    } catch (error) {
        setOutput("Bukan cURL njir");
    }
};



  const calculateButtonPosition = () => {
    const buttonRect = buttonRef.current.getBoundingClientRect();
    const x = buttonRect.left + buttonRect.width / 2;
    const y = buttonRect.top + buttonRect.height / 2;
    return { x, y };
  };

  useEffect(() => {
    const hasShownFlyingText = localStorage.getItem("hasShownFlyingText");
    if (hasShownFlyingText === null) {
      setShowFlyingText(false);
    } else {
      localStorage.removeItem("hasShownFlyingText");
    }
  }, []);

  return (
    <div>
      <div className="container has-text-centered">
        <div className="columns is-centered">
          <div className="column is-half">
            <br />
            <br />
            <img
              src={curllocust}
              width={150}
              className="animate__animated animate__bounceInDown"
              alt="logo"
            />
            <p className="animate__animated animate__fadeIn animate__slow">
              Convert cURL from postman into locust request format
            </p>
            <br />
            <div className="field">
              <div className="control">
                <textarea
                  className="textarea"
                  rows={10}
                  cols={80}
                  value={curlInput}
                  onChange={handleInputChange}
                  placeholder="Enter your cURL command here..."
                />
                 {curlInput && (
                  <button
                  className="clear-input-button button is-text has-text-danger"
                  onClick={handleClearInput}
                >
                  <span className="icon">
                    <i className="fas fa-times"></i>
                  </span>
                </button>
                )}
              </div>
            </div>
            <div className="field is-grouped is-justify-content-center">
              <div className="control">
                <button
                  ref={buttonRef}
                  className="button is-success custom-rounded"
                  onClick={convertCurlToLocust}
                >
                  Convert!
                </button>
                {showFlyingText && (
                  <FlyingText
                    text="awikwok 🗿"
                    onComplete={handleFlyingTextComplete}
                  />
                )}
              </div>
            </div>
            <div
              className="control"
              style={{
                whiteSpace: "pre-wrap",
                fontFamily: "'Karla', sans-serif",
              }}
            >
              <SyntaxHighlighter
                language="javascript"
                style={a11yDark}
                wrapLongLines
              >
                {output}
              </SyntaxHighlighter>
              <br />
              <CopyToClipboard text={output} onCopy={handleCopy}>
                <button
                  className={`button custom-rounded has-text-weight-medium ${copied ? "is-primary" : "is-success"
                    }`}
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </CopyToClipboard>
              <br />
              <br />
            </div>
          </div>
        </div>
      </div>
      {showConfetti && (
        <Confetti
          recycle={false}
          numberOfPieces={100}
          confettiSource={calculateButtonPosition()}
        />
      )}
      <footer className="footer has-text-black">
        <div className="content has-text-centered">
          <p className="is-size-7 animate__animated animate__fadeIn animate__slow animate__delay-1s">
            Created by{" "}
            <a href="https://www.linkedin.com/in/hilalmustofa">mzhll</a>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
