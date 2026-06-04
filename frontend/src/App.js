import { Toaster } from 'sonner';
import { PipelineToolbar } from './toolbar';
import { PipelineUI } from './ui';
import { SubmitButton } from './submit';

function App() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <PipelineToolbar />
      <PipelineUI />
      <SubmitButton />
      <Toaster position="bottom-center" richColors closeButton />
    </div>
  );
}

export default App;
