import { ThemeProvider } from './context/ThemeContext';
import { ChatContainer } from './components/ChatContainer';

function App() {
  return (
    <ThemeProvider>
      <div className="flex h-screen overflow-hidden">
        <div
          className="hidden lg:flex bg-cover bg-center relative"
          style={{
            width: '40%',
            backgroundImage: "url('/robot.png')",
            backgroundRepeat: 'no-repeat',
            backgroundPosition: '60% 5%',
            backgroundSize: '124%',
            filter: 'brightness(1.02) contrast(1.05) saturate(1.05)'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/10" />

          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 w-11/12 max-w-3xl text-center">
            <h1
              className="text-5xl lg:text-6xl font-extrabold text-white mx-auto"
              style={{
                textShadow: '0 10px 36px rgba(0,0,0,0.7), 0 1px 0 rgba(255,255,255,0.03)',
                WebkitTextStroke: '0.9px rgba(0,0,0,0.55)'
              }}
            >
              NAVA EXPERT
            </h1>
          </div>

        </div>

        <div className="flex-1" style={{ width: '60%', minWidth: 0 }}>
          <div style={{ width: '100%' }} className="lg:hidden" />
          <ChatContainer />
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;
