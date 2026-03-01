import { useState } from "react"

export function useConfiguracoes() {
    const[notificacoes, setNotificacoes] = useState(false)
    const[contagemSuporte, setContagemSuporte] = useState(0)
    
    const clickarNotificacoes = () => {
        setNotificacoes(!notificacoes)
    }
    
    const clicarSuporte = () => {
        const novaContagem = contagemSuporte + 1
        setContagemSuporte(novaContagem)
        console.log('Clique no suporte:', novaContagem)

        if (novaContagem === 5) {
            console.log('5 cliques atingidos! Tentando tocar áudio...')

            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
            const audioContext = new AudioContextClass()

            try {
                const audio = new Audio('/tigreso.mp3')
                audio.crossOrigin = 'anonymous'
                audio.volume = 1

                const source = audioContext.createMediaElementSource(audio)
                const gainNode = audioContext.createGain()
                source.connect(gainNode)
                gainNode.connect(audioContext.destination)

                gainNode.gain.value = 5.0

                console.log('🔊 Tocando tigreso.mp3 com ganho:', gainNode.gain.value)
                audio.play().catch((error) => {
                    console.error('❌ Erro no MP3, fallback para beep:', error)

                    const oscillator = audioContext.createOscillator()
                    const fallbackGainNode = audioContext.createGain()
                    oscillator.connect(fallbackGainNode)
                    fallbackGainNode.connect(audioContext.destination)

                    oscillator.frequency.value = 900
                    oscillator.type = 'square'
                    fallbackGainNode.gain.value = 0.8

                    oscillator.start()
                    oscillator.stop(audioContext.currentTime + 0.25)
                })

                audio.onended = () => console.log('✅ Áudio finalizado!')
            } catch (error) {
                console.error('❌ Erro ao preparar áudio:', error)
            }
        }
    }
    
    const resetarContador = () => {
        setContagemSuporte(0)
    }
    
    return {notificacoes, clickarNotificacoes, contagemSuporte, clicarSuporte, resetarContador}
}