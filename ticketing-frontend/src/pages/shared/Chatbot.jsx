import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { sendUserMessageToChatbot, getChatHistory } from '../../api/api'; // Assurez-vous que le chemin est correct
import { AuthContext } from '../../context/AuthContext';
import ReactMarkdown from 'react-markdown';
import moment from 'moment';

const Chatbot = () => {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const { user, token } = useContext(AuthContext);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    const fetchChatHistory = useCallback(async () => {
        if (!user || !user._id || !user.role || !token) {
            console.warn("Client (frontend): Informations utilisateur ou token manquants pour charger l'historique du chat. Ignoré.");
            return;
        }
        try {
            const historyData = await getChatHistory();
            if (historyData) {
                setMessages(historyData.map(msg => ({
                    text: msg.text,
                    sender: msg.sender,
                    timestamp: new Date(msg.timestamp),
                    link: msg.link || null
                })));
            }
        } catch (error) {
            console.error("Client (frontend): Erreur lors du chargement de l'historique du chat:", error);
        }
    }, [user, token]);

    useEffect(() => {
        if (isOpen && user && token && messages.length === 0) {
            fetchChatHistory();
        }
    }, [isOpen, user, token, messages.length, fetchChatHistory]);

    const handleSendMessage = useCallback(async () => {
        if (inputValue.trim() === '' || isLoading) {
            return;
        }

        const newUserMessage = { text: inputValue, sender: 'user', timestamp: new Date() };
        setMessages((prevMessages) => [...prevMessages, newUserMessage]);

        const messageToSend = inputValue;
        setInputValue('');
        setIsLoading(true);

        try {
            const response = await sendUserMessageToChatbot(messageToSend, user?._id, user?.role);

            if (response && response.reply) {
                const botMessage = {
                    text: response.reply,
                    sender: 'bot',
                    timestamp: new Date(),
                    link: response.link || null
                };
                setMessages((prevMessages) => [...prevMessages, botMessage]);
            } else {
                console.warn("Client (frontend): Réponse du bot invalide ou incomplète :", response);
                setMessages((prevMessages) => [
                    ...prevMessages,
                    { text: "Désolé, je n'ai pas reçu de réponse valide du bot.", sender: 'bot', timestamp: new Date() }
                ]);
            }
        } catch (error) {
            console.error("Client (frontend): Erreur lors de l'envoi du message au chatbot:", error);
            
            let botErrorMessage = "Une erreur est survenue lors de la communication avec le chatbot. Veuillez réessayer plus tard.";

            if (error.response) { 
                if (error.response.status === 401) {
                    botErrorMessage = "Vous devez vous connecter pour que je puisse vous répondre.";
                } else if (error.response.data) { 
                    if (error.response.data.reply) {
                        botErrorMessage = error.response.data.reply;
                    } else if (error.response.data.message) {
                        botErrorMessage = error.response.data.message;
                    }
                }
            }

            setMessages((prevMessages) => [
                ...prevMessages,
                { text: botErrorMessage, sender: 'bot', timestamp: new Date() }
            ]);
        } finally {
            setIsLoading(false);
        }
    }, [inputValue, isLoading, user, token]);

    const handleKeyPress = (event) => {
        if (event.key === 'Enter') {
            handleSendMessage();
        }
    };

    const toggleChatbot = () => {
        setIsOpen(!isOpen);
    };

    // Styles
    const chatbotContainerStyle = {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 1000, 
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", 
    };

    const toggleButtonStyle = {
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '24px', // Ajusté
        width: '115px',      // Ajusté
        height: '48px',       // Ajusté
        fontSize: '16px',     // Ajusté
        fontWeight: '600',
        cursor: 'pointer',
        boxShadow: '0 4px 10px rgba(0,0,0,0.2)', // Ombre légèrement ajustée
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        paddingLeft: '12px',  // Ajusté
        paddingRight: '12px', // Ajusté
        transition: 'transform 0.2s ease-out, background-color 0.2s ease',
    };

    const chatWindowStyle = {
        width: '420px', 
        height: '600px', 
        backgroundColor: '#ffffff', 
        borderRadius: '15px', 
        boxShadow: '0 8px 25px rgba(0,0,0,0.2)', 
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        marginTop: '10px', 
        border: '1px solid #e0e0e0', 
    };

    const chatHeaderStyle = {
        backgroundColor: '#007bff',
        color: 'white',
        padding: '15px 20px', 
        borderTopLeftRadius: '14px', 
        borderTopRightRadius: '14px', 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '1.2em', 
        fontWeight: '600',
    };

    const closeButtonStyle = {
        backgroundColor: 'transparent',
        border: 'none',
        color: 'white',
        fontSize: '1.5em', 
        cursor: 'pointer',
        padding: '5px',
        lineHeight: '1',
        borderRadius: '50%',
        transition: 'background-color 0.2s ease',
    };
    
    const closeButtonHoverStyle = { 
        backgroundColor: 'rgba(255,255,255,0.2)',
    };


    const messagesContainerStyle = {
        flexGrow: 1,
        padding: '20px', 
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#f0f2f5', 
    };

    const messageBaseStyle = {
        maxWidth: '85%', 
        padding: '10px 15px',
        borderRadius: '18px', 
        marginBottom: '12px',
        wordBreak: 'break-word',
        whiteSpace: 'pre-wrap',
        position: 'relative',
        lineHeight: '1.4',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    };

    const userMessageStyle = {
        ...messageBaseStyle,
        alignSelf: 'flex-end',
        backgroundColor: '#007bff', 
        color: 'white',
        borderBottomRightRadius: '5px', 
    };

    const botMessageStyle = {
        ...messageBaseStyle,
        alignSelf: 'flex-start',
        backgroundColor: '#ffffff', 
        color: '#333',
        border: '1px solid #e0e0e0', 
        borderBottomLeftRadius: '5px', 
    };
    
    const messageTimestampStyle = {
        fontSize: '0.75em', 
        position: 'absolute', 
        bottom: '5px', 
        right: '10px', 
        opacity: 0.9,
    };
    
    const userTimestampStyle = { 
        ...messageTimestampStyle,
        color: 'rgba(255, 255, 255, 0.8)', 
    };

    const botTimestampStyle = { 
        ...messageTimestampStyle,
        color: '#888',
    };


    const messageLinkStyle = {
        display: 'block',
        marginTop: '8px',
        fontSize: '0.9em',
        fontWeight: 'bold',
    };

    const userLinkStyle = { 
        ...messageLinkStyle,
        color: '#e6f2ff', 
    }

    const botLinkStyle = { 
        ...messageLinkStyle,
        color: '#0056b3', 
    }

    const chatInputAreaStyle = {
        display: 'flex',
        alignItems: 'center', 
        borderTop: '1px solid #e0e0e0',
        padding: '12px 15px', 
        backgroundColor: '#ffffff', 
    };

    const chatInputStyle = {
        flexGrow: 1,
        border: '1px solid #d0d0d0', 
        borderRadius: '20px', 
        padding: '12px 18px', 
        marginRight: '10px',
        fontSize: '1em',
        backgroundColor: '#f0f2f5', 
        outline: 'none', 
        transition: 'border-color 0.2s ease',
    };

    const inputFocusStyle = {
         borderColor: '#007bff',
    };


    const sendButtonStyle = {
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '20px', 
        padding: '12px 20px', 
        cursor: 'pointer',
        fontSize: '1em',
        fontWeight: '500',
        transition: 'background-color 0.2s ease',
        outline: 'none',
    };

    const sendButtonDisabledStyle = {
        backgroundColor: '#a0c7e4', 
        cursor: 'not-allowed',
    };
    
    const sendButtonHoverStyle = {
        backgroundColor: '#0056b3', 
    };


    return (
        <div style={chatbotContainerStyle}>
            {/* Le bouton n'est affiché que si la fenêtre est fermée */}
            {!isOpen && (
                <button 
                    onClick={toggleChatbot} 
                    style={toggleButtonStyle}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'} 
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    Chatbot
                </button>
            )}

            {/* La fenêtre de chat n'est affichée que si elle est ouverte */}
            {isOpen && (
                <div style={chatWindowStyle}>
                    <div style={chatHeaderStyle}>
                        <span>Assistance Chatbot</span>
                        <button 
                            onClick={toggleChatbot} 
                            style={closeButtonStyle}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = closeButtonHoverStyle.backgroundColor}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            ✕ 
                        </button>
                    </div>
                    <div style={messagesContainerStyle}>
                        {messages.map((msg, index) => {
                            const isUser = msg.sender === 'user';
                            const currentMessageStyle = isUser ? userMessageStyle : botMessageStyle;
                            const currentTimestampStyle = isUser ? userTimestampStyle : botTimestampStyle;
                            const currentLinkStyle = isUser ? userLinkStyle : botLinkStyle;

                            return (
                                <div key={index} style={currentMessageStyle}>
                                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                                    {msg.link && msg.link.url && ( 
                                        <a 
                                            href={msg.link.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            style={currentLinkStyle}
                                        >
                                            {msg.link.text || 'Plus d\'infos ici'}
                                        </a>
                                    )}
                                    <span style={currentTimestampStyle}>
                                        {moment(msg.timestamp).format('HH:mm')}
                                    </span>
                                
                                </div>
                            );
                        })}
                        {isLoading && (
                            <div style={{
                                ...botMessageStyle, 
                                backgroundColor: '#e9ecef', 
                                fontStyle: 'italic',
                                color: '#6c757d', 
                                opacity: 0.9,
                                border: 'none',
                                boxShadow: 'none',
                            }}>
                                Le bot est en train de taper...
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                    <div style={chatInputAreaStyle}>
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder={isLoading ? "Envoi en cours..." : "Tapez votre message..."}
                            style={isLoading ? {...chatInputStyle, ...inputFocusStyle} : chatInputStyle} 
                            disabled={isLoading}
                            onFocus={(e) => e.currentTarget.style.borderColor = inputFocusStyle.borderColor}
                            onBlur={(e) => e.currentTarget.style.borderColor = '#d0d0d0'}
                        />
                        <button
                            onClick={handleSendMessage}
                            style={isLoading ? {...sendButtonStyle, ...sendButtonDisabledStyle} : sendButtonStyle}
                            disabled={isLoading}
                            onMouseEnter={(e) => { if (!isLoading) e.currentTarget.style.backgroundColor = sendButtonHoverStyle.backgroundColor; }}
                            onMouseLeave={(e) => { if (!isLoading) e.currentTarget.style.backgroundColor = sendButtonStyle.backgroundColor; }}
                        >
                            {isLoading ? 'Envoi...' : 'Envoyer'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Chatbot;