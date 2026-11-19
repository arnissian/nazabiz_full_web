import { useRef } from 'react';

interface OtpInputProps {
  otp: string;
  setOtp: (value: string) => void;
  disabled?: boolean;
}

export default function OtpInput({ otp, setOtp, disabled = false }: OtpInputProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (value: string, index: number) => {
    if (!/^[0-9]?$/.test(value)) return;

    const digits = Array.from({ length: 6 }, (_, digitIndex) => otp[digitIndex] ?? '');
    digits[index] = value;
    setOtp(digits.join(''));

    if (value && index < 5) inputsRef.current[index + 1]?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (event.key === 'Backspace' && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
    if (event.key === 'ArrowLeft' && index > 0) inputsRef.current[index - 1]?.focus();
    if (event.key === 'ArrowRight' && index < 5) inputsRef.current[index + 1]?.focus();
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pastedDigits = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedDigits) return;

    setOtp(pastedDigits);
    inputsRef.current[Math.min(pastedDigits.length, 5)]?.focus();
  };

  return (
    <>
      <style>{`
        .otp-inputs-container {
          display: flex;
          justify-content: center;
          gap: 10px;
          margin: 20px 0;
        }
        .otp-digit-input {
          width: 38px;
          height: 46px;
          border: 1px solid rgba(23, 107, 89, 0.2);
          border-radius: 8px;
          outline: none;
          background: #fff;
          color: #1a2e2a;
          text-align: center;
          font-size: 20px;
          font-weight: 700;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .otp-digit-input:focus {
          border-color: #176b59;
          box-shadow: 0 0 0 3px rgba(23, 107, 89, 0.12);
        }
        .otp-digit-input:disabled {
          cursor: wait;
          opacity: 0.65;
        }
        @media (max-width: 480px) {
          .otp-inputs-container { gap: 6px; }
          .otp-digit-input { width: 40px; height: 48px; font-size: 18px; }
        }
      `}</style>
      <div className="otp-inputs-container" role="group" aria-label="Code de vérification à six chiffres">
        {Array.from({ length: 6 }, (_, index) => (
          <input
            key={index}
            ref={element => { inputsRef.current[index] = element; }}
            type="text"
            inputMode="numeric"
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            aria-label={`Chiffre ${index + 1}`}
            maxLength={1}
            className="otp-digit-input"
            value={otp[index] ?? ''}
            onChange={event => handleChange(event.target.value, index)}
            onKeyDown={event => handleKeyDown(event, index)}
            onPaste={handlePaste}
            autoFocus={index === 0}
            disabled={disabled}
          />
        ))}
      </div>
    </>
  );
}
