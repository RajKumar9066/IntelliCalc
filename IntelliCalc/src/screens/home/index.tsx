import React, { useEffect, useRef, useState } from "react";
import { SWATCHES } from '../../../constants';
import { ColorSwatch, Group } from '@mantine/core';
import { Button } from '../../components/ui/button';
import axios from 'axios';
import Draggable from 'react-draggable';

interface Response {
    expr: string;
    result: string;
    assign: boolean;
}

interface GenerateResult {
    expression: string;
    answer: string;
}

export default function Home() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('rgb(255, 255, 255)');
    const [reset, setRest] = useState(false);
    const [result, setResult] = useState<GenerateResult>();
    const [latexPosition, setLatexPosition] = useState({ x: 10, y: 200 });
    const [latexExpression, setLatexExpression] = useState<Array<string>>([]);
    const [dictOfVars, setDictOfVars] = useState({});

    // Resetting the canvas
    useEffect(() => {
        if (reset) {
            resetCanvas();
            setLatexExpression([]);
            setResult(undefined);
            setDictOfVars({});
            setRest(false);
        }
    }, [reset]);

    // Update LaTeX rendering after each change
    useEffect(() => {
        if (latexExpression.length > 0 && window.MathJax) {
            if (window.MathJax.typeset) {
                window.MathJax.typeset(); // For MathJax v3
            } else if (window.MathJax.Hub && window.MathJax.Hub.Queue) {
                window.MathJax.Hub.Queue(["Typeset", window.MathJax.Hub]); // For MathJax v2
            }
        }
    }, [latexExpression]);

    // Render the result on the canvas after data retrieval
    useEffect(() => {
        if (result) {
            renderLatexToCanvas(result.expression, result.answer);
        }
    }, [result]);

    // Function to reset the canvas
    const resetCanvas = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }
    };

    // Setting up the canvas and MathJax
    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight - canvas.offsetTop;
                ctx.lineCap = 'round';
                ctx.lineWidth = 3;
            }
        }

        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.7/MathJax.js?config=TeX-MML-AM_CHTML';
        document.head.appendChild(script);

        script.onload = () => {
            window.MathJax = window.MathJax || {
                Hub: {
                    Queue: function () {
                        // Use this for v2, ignore if v3
                    },
                },
            };
        };

        return () => {
            document.head.removeChild(script);
        };
    }, []);

    // Rendering LaTeX expression to canvas
    const renderLatexToCanvas = (expression: string, answer: string) => {
        const latex = `\\(\\LARGE{${expression} = ${answer}}\\)`;
        setLatexExpression([...latexExpression, latex]);

        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas
            }
        }
    };

    // Sending data to API
    const sendData = async () => {
        const canvas = canvasRef.current;

        if (canvas) {
            const response = await axios({
                method: 'post',
                url: `${import.meta.env.VITE_API_URL}/calculate`,
                data: {
                    image: canvas.toDataURL('image/png'),
                    dict_of_vars: dictOfVars,
                }
            });

            const resp = await response.data;
            resp.data.forEach((data: Response) => {
                if (data.assign === true) {
                    setDictOfVars({
                        ...dictOfVars,
                        [data.expr]: data.result,
                    });
                }
            });

            const ctx = canvas.getContext('2d');
            const imageData = ctx!.getImageData(0, 0, canvas.width, canvas.height);
            let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;

            for (let y = 0; y < canvas.height; y++) {
                for (let x = 0; x < canvas.width; x++) {
                    const i = (y * canvas.width + x) * 4;
                    if (imageData.data[i + 3] > 0) {  // If pixel is not transparent
                        minX = Math.min(minX, x);
                        minY = Math.min(minY, y);
                        maxX = Math.max(maxX, x);
                        maxY = Math.max(maxY, y);
                    }
                }
            }

            const centerX = (minX + maxX) / 2;
            const centerY = (minY + maxY) / 2;

            setLatexPosition({ x: centerX, y: centerY });
            resp.data.forEach((data: Response) => {
                setTimeout(() => {
                    setResult({
                        expression: data.expr,
                        answer: data.result,
                    });
                }, 1000);
            });
        }
    };

    // Drawing on the canvas
    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;

        if (canvas) {
            canvas.style.background = 'black';
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.beginPath();
                ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
                setIsDrawing(true);
            }
        }
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) {
            return;
        }
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.strokeStyle = color;
                ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
                ctx.stroke();
            }
        }
    };

    return (
        <div className="container flex flex-col items-center">
            <div className='controls flex justify-between items-center w-full mb-4 mt-4'>
                <Button
                    onClick={() => setRest(true)}
                    className='bg-black text-white'
                    variant='default'
                    color='black'
                >
                    Reset
                </Button>
                <Group className='z-20'>
                    {SWATCHES.map((swatchColor: string) => (
                        <ColorSwatch
                            key={swatchColor}
                            color={swatchColor}
                            onClick={() => setColor(swatchColor)}
                        />
                    ))}
                </Group>
                <Button
                    onClick={sendData}
                    className='bg-black text-white'
                    variant='default'
                    color='black'
                >
                    Calculate
                </Button>
            </div>
            <canvas
                ref={canvasRef}
                className='canvas border border-black w-full mb-1'
                onMouseDown={startDrawing}
                onMouseOut={stopDrawing}
                onMouseUp={stopDrawing}
                onMouseMove={draw}
            />
            {latexExpression && latexExpression.map((latex, index) => (
                <Draggable
                    key={index}
                    defaultPosition={latexPosition}
                    onStop={(e, data) => setLatexPosition({ x: data.x, y: data.y })}
                >
                    <div className="absolute p-2 text-white rounded shadow-md">
                        <div className="latex-content">{latex}</div>
                    </div>
                </Draggable>
            ))}
        </div>
    );
}
