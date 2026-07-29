import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, CheckCircle2, Loader2, ScanLine, Search, ShieldCheck, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/useAuth';

type ScanResult = {
  valid: boolean;
  reason?: string;
  ticket?: {
    ticket_id: string;
    passenger_name: string;
    seat_number: string;
    ticket_type: string;
    total_fcfa: number;
    payment_status: string;
    schedule: { origin: string; destination: string; departure_time: string; arrival_time: string | null };
  };
};

type BarcodeDetectorLike = {
  detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue?: string }>>;
};

declare global {
  interface Window {
    BarcodeDetector?: new (options?: { formats: string[] }) => BarcodeDetectorLike;
  }
}

function extractTicketId(value: string) {
  const trimmed = value.trim();
  try {
    const parsed = JSON.parse(trimmed) as { id?: unknown; ticket_id?: unknown };
    if (typeof parsed.id === 'string') return parsed.id.trim();
    if (typeof parsed.ticket_id === 'string') return parsed.ticket_id.trim();
  } catch {
    // The manual fallback accepts a plain ticket ID as well as the current JSON QR payload.
  }
  return trimmed;
}

export default function ScanTicket() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<BarcodeDetectorLike | null>(null);
  const scanLoopRef = useRef<number | null>(null);
  const [authorizing, setAuthorizing] = useState(true);
  const [cameraError, setCameraError] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [manualId, setManualId] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!user) { navigate('/login'); return; }
      const { data, error } = await supabase.rpc('current_admin_role');
      if (!active) return;
      if (error || !['agent', 'manager', 'super_admin'].includes(String(data))) navigate('/');
      setAuthorizing(false);
    })();
    return () => { active = false; };
  }, [navigate, user]);

  const stopCamera = useCallback(() => {
    if (scanLoopRef.current !== null) cancelAnimationFrame(scanLoopRef.current);
    scanLoopRef.current = null;
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  }, []);

  const verify = useCallback(async (rawValue: string) => {
    const ticketId = extractTicketId(rawValue);
    setVerifying(true);
    setResult(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Your session has expired. Please sign in again.');
      const { data, error } = await supabase.functions.invoke('verify-ticket', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { ticketId },
      });
      if (error) {
        const response = (error as { context?: Response }).context;
        const body = response ? await response.clone().json().catch(() => null) as { error?: string } | null : null;
        throw new Error(body?.error ?? error.message);
      }
      setResult(data as ScanResult);
      stopCamera();
    } catch (error) {
      setResult({ valid: false, reason: error instanceof Error ? error.message : 'Unable to verify ticket' });
    } finally {
      setVerifying(false);
    }
  }, [stopCamera]);

  const startCamera = async () => {
    setCameraError('');
    setResult(null);
    if (!window.BarcodeDetector) {
      setCameraError('QR scanning is not supported by this browser. Enter the ticket ID manually below, or use Chrome on Android/iPhone.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      streamRef.current = stream;
      if (!videoRef.current) return;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      detectorRef.current = new window.BarcodeDetector({ formats: ['qr_code'] });
      setCameraActive(true);
      const scan = async () => {
        if (!videoRef.current || !detectorRef.current || !streamRef.current) return;
        try {
          const codes = await detectorRef.current.detect(videoRef.current);
          const raw = codes[0]?.rawValue;
          if (raw) { await verify(raw); return; }
        } catch { /* Keep the camera alive; a frame can be unreadable while moving. */ }
        scanLoopRef.current = requestAnimationFrame(scan);
      };
      scanLoopRef.current = requestAnimationFrame(scan);
    } catch (error) {
      setCameraError(error instanceof DOMException && error.name === 'NotAllowedError'
        ? 'Camera access was denied. Allow camera access or enter the ticket ID manually.'
        : 'Unable to start the camera. Enter the ticket ID manually instead.');
      stopCamera();
    }
  };

  useEffect(() => stopCamera, [stopCamera]);

  if (authorizing) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <Link to="/admin" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6"><ArrowLeft className="w-4 h-4" /> Back to dashboard</Link>
        <div className="flex items-center gap-3 mb-2"><ScanLine className="w-8 h-8 text-amber-400" /><h1 className="text-3xl font-bold">Scan passenger ticket</h1></div>
        <p className="text-gray-400 mb-6">Verify the ticket against the live booking and payment record before boarding.</p>

        <div className="grid lg:grid-cols-2 gap-6">
          <section className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between"><h2 className="font-bold flex items-center gap-2"><Camera className="w-5 h-5 text-teal-400" /> Camera scanner</h2>{cameraActive && <button onClick={stopCamera} className="text-sm text-red-400 hover:text-red-300">Stop</button>}</div>
            <div className="aspect-video rounded-xl bg-gray-950 overflow-hidden border border-gray-800 flex items-center justify-center">
              {cameraActive ? <video ref={videoRef} muted playsInline className="w-full h-full object-cover" /> : <div className="text-center text-gray-500 px-6"><Camera className="w-10 h-10 mx-auto mb-2 opacity-60" /><p>Start the camera and point it at the QR code.</p></div>}
            </div>
            {!cameraActive && <button onClick={startCamera} className="w-full bg-teal-500 hover:bg-teal-400 text-white font-bold py-3 rounded-xl">Start camera</button>}
            {cameraError && <p className="text-sm text-amber-300 bg-amber-400/10 border border-amber-400/30 rounded-lg p-3">{cameraError}</p>}
          </section>

          <section className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
            <h2 className="font-bold flex items-center gap-2"><Search className="w-5 h-5 text-amber-400" /> Manual verification</h2>
            <p className="text-sm text-gray-400">If the camera is unavailable, type the ticket ID printed below the QR code.</p>
            <input value={manualId} onChange={event => setManualId(event.target.value)} placeholder="e.g. TKT-20260729-0001" className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:border-amber-400 outline-none" />
            <button disabled={!manualId.trim() || verifying} onClick={() => verify(manualId)} className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-gray-950 font-bold py-3 rounded-xl">{verifying ? 'Verifying…' : 'Verify ticket'}</button>
            <div className="rounded-xl bg-blue-400/10 border border-blue-400/20 p-3 text-sm text-blue-200 flex gap-2"><ShieldCheck className="w-5 h-5 shrink-0" /> Only staff accounts can use this verifier. The server checks payment and schedule status.</div>
          </section>
        </div>

        {verifying && <div className="mt-6 flex items-center justify-center gap-2 text-gray-300"><Loader2 className="w-5 h-5 animate-spin" /> Checking ticket…</div>}
        {result && (
          <div className={`mt-6 rounded-2xl border p-6 ${result.valid ? 'bg-green-400/10 border-green-400/40' : 'bg-red-400/10 border-red-400/40'}`}>
            <div className="flex items-center gap-3 mb-4">{result.valid ? <CheckCircle2 className="w-8 h-8 text-green-400" /> : <XCircle className="w-8 h-8 text-red-400" />}<h2 className="text-2xl font-bold">{result.valid ? 'Valid ticket' : 'Ticket not valid'}</h2></div>
            {!result.valid && <p className="text-red-200">{result.reason}</p>}
            {result.valid && result.ticket && <div className="grid sm:grid-cols-2 gap-3 text-sm"><p><span className="text-gray-400">Ticket:</span> {result.ticket.ticket_id}</p><p><span className="text-gray-400">Passenger:</span> {result.ticket.passenger_name}</p><p><span className="text-gray-400">Seat:</span> {result.ticket.seat_number}</p><p><span className="text-gray-400">Payment:</span> {result.ticket.payment_status}</p><p><span className="text-gray-400">Route:</span> {result.ticket.schedule.origin} → {result.ticket.schedule.destination}</p><p><span className="text-gray-400">Departure:</span> {new Date(result.ticket.schedule.departure_time).toLocaleString()}</p></div>}
          </div>
        )}
      </div>
    </div>
  );
}
