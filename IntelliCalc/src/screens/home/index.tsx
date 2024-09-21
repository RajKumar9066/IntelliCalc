import React, {useEffect, useRef, useState } from "react";
import {SWATCHES} from '../../../constants'
import { ColorSwatch, Group } from '@mantine/core';
import {Button} from '../../components/ui/button';
import axios from 'axios';

interface  Response {
    expr : string;
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
    const [dictOfVars, setDictOfVars] = useState({});
    

    useEffect(() => {
        if(reset){
            resetCanvas();
            setRest(false);
        }
    }, [reset]);

    const resetCanvas = () => {
        const canvas = canvasRef.current;
        if (canvas){
            const ctx = canvas.getContext('2d');
            if(ctx) {
                ctx.clearRect(0,0, canvas.width, canvas.height)
            }
        }

    }


    useEffect(() => {
        const canvas = canvasRef.current;
        if(canvas){
            const ctx = canvas.getContext('2d');
            if(ctx){
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight-canvas.offsetTop;
                ctx.lineCap = 'round';
                ctx.lineWidth = 3;
            }
        }
    }, []);

    const sendData = async () => {
        const canvas = canvasRef.current;

        if(canvas){
            const response = await axios({
                method: 'post',
                url: `${import.meta.env.VITE_API_URL}/calculate`,
                data: {
                    image: canvas.toDataURL('image/png'),
                    dict_of_vars: dictOfVars,
                }
            });
            const resp = await response.data;
            console.log('Response:', resp);
        }
    }


    const startDrawing = ( e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;

        if(canvas) { 
            canvas.style.background = 'black';
            const ctx = canvas.getContext('2d');
            if(ctx){
                ctx.beginPath();
                ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
                setIsDrawing(true);
            }
        }
    }

    const stopDrawing = () =>{
        setIsDrawing(false);
    }

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if(!isDrawing){
            return;
        }
        const canvas = canvasRef.current;
        if(canvas){
            const ctx = canvas.getContext('2d');
            if (ctx){
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
                        className='bg-black text-white '
                        variant='default'
                        color='black'
                        >
                            Reset
                        </Button>
                        <Group className='z-20'>
                            {SWATCHES.map((swatchColor: string) =>(
                                <ColorSwatch
                                    key={swatchColor}
                                    color={swatchColor}
                                    onClick={() => setColor(swatchColor)}
                                />
                            ))}
                        </Group>
                        <Button
                        onClick= {sendData}
                        className='bg-black text-white'
                        variant='default'
                        color='black'
                        >
                            Calculate
                        </Button>
                </div>
                <canvas
                ref = {canvasRef}
                // id = 'canvas'
                className='canvas border border-black w-full mb-1'
                onMouseDown={startDrawing}
                onMouseOut={stopDrawing}
                onMouseUp={stopDrawing}
                onMouseMove={draw}
                />
            </div>
        )
    };
