import { useState } from 'react';
import { Spinner } from '@/components/Spinner';
import { usePublicServices, usePublicTimeSlots, useCreateBooking } from '@/hooks/useApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Logo from '@/components/Logo';
import DatePickerField from '@/components/DatePickerField';
import dayjs from 'dayjs';
import { CheckCircle} from 'lucide-react';
import { PhoneInput } from '@/components/PhoneInput';

const BookingPage = () => {
  const { data: services = [], isLoading: servicesLoading } = usePublicServices();
  const [step, setStep] = useState<'service' | 'time' | 'info' | 'done'>('service');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedServiceName, setSelectedServiceName] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const { data: timeSlots = [], isLoading: slotsLoading } = usePublicTimeSlots(selectedDate);
  const createBooking = useCreateBooking();

  const handleBook = () => {
    const [firstName, ...rest] = name.trim().split(' ');
    const lastName = rest.join(' ') || '';
    createBooking.mutate(
      {
        serviceId: selectedServiceId,
        date: selectedDate,
        time: selectedTime,
        firstName,
        lastName,
        phone,
        email: email || undefined,
      },
      { onSuccess: () => setStep('done') },
    );
  };

  const minDate = dayjs().add(1, 'day').format('YYYY-MM-DD');

  return (
    <div className="min-h-screen bg-background flex flex-col items-center py-5 sm:py-8 px-3 sm:px-4">
      <div className="mb-5 sm:mb-8">
        <Logo size="lg" />
      </div>
      <div className="w-full max-w-lg">
        <div className="bg-card rounded-2xl p-4 sm:p-8 card-3d">
          {step === 'done' ? (
            <div className="text-center py-4 sm:py-8 space-y-3 sm:space-y-4">
              <div className="w-16 h-16 rounded-full bg-success/15 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-foreground">Booking Confirmed!</h2>
              <p className="text-muted-foreground text-sm leading-relaxed px-1 sm:px-0">
                Your {selectedServiceName} appointment on {selectedDate} at {selectedTime} has been booked.
              </p>
              <p className="text-muted-foreground text-sm break-words px-1 sm:px-0">A confirmation SMS has been sent to {phone}.</p>
              <p className="text-xs text-muted-foreground mt-2 sm:mt-4 px-1 sm:px-0 leading-relaxed">
                Please complete your intake form via the link in your SMS.
              </p>
            </div>
          ) : (
            <>
              {/* Progress */}
              <div className="flex gap-2 mb-6">
                {['service', 'time', 'info'].map((s, i) => (
                  <div key={s} className={`h-1.5 flex-1 rounded-full ${
                    ['service', 'time', 'info'].indexOf(step) >= i ? 'bg-primary' : 'bg-muted'
                  }`} />
                ))}
              </div>

              {step === 'service' && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-foreground">Select a Service</h2>
                  {servicesLoading ? (
                    <div className="flex justify-center py-8"><Spinner size="sm" /></div>
                  ) : (
                    <div className="space-y-2">
                      {services.filter((s) => !s.name.toLowerCase().includes('follow-up')).map((s) => (
                        <button
                          key={s._id}
                          onClick={() => { setSelectedServiceId(s._id); setSelectedServiceName(s.name); setStep('time'); }}
                          className={`w-full text-left p-4 rounded-xl border transition-all hover:shadow-3d-hover ${
                            selectedServiceName === s.name ? 'border-primary bg-primary/5' : 'border-border'
                          }`}
                        >
                          <p className="font-semibold text-foreground">{s.name}</p>
                          <p className="text-sm text-muted-foreground">{s.duration} min · ${s.price}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {step === 'time' && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-foreground">Choose Date & Time</h2>
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <DatePickerField
                      value={selectedDate}
                      onChange={(date) => {
                        setSelectedDate(date);
                        setSelectedTime('');
                      }}
                      minDate={minDate}
                      placeholder="Select booking date"
                    />
                  </div>
                  {selectedDate && (
                    <div className="space-y-2">
                      <Label>Available Times</Label>
                      {slotsLoading ? (
                        <div className="flex justify-center py-4"><Spinner size="sm" /></div>
                      ) : (
                        <>
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {timeSlots.map((slot) => {
                              const disabled = !slot.available;
                              return (
                                <button
                                  key={slot.time}
                                  disabled={disabled}
                                  onClick={() => !disabled && setSelectedTime(slot.time)}
                                  className={`py-2 rounded-xl text-sm font-medium border transition-all ${
                                    disabled
                                      ? 'border-border bg-muted text-muted-foreground line-through cursor-not-allowed opacity-50'
                                      : selectedTime === slot.time
                                      ? 'border-primary bg-primary text-primary-foreground'
                                      : 'border-border text-foreground hover:border-primary/50'
                                  }`}
                                  title={disabled ? 'Unavailable' : undefined}
                                >
                                  {slot.time}
                                </button>
                              );
                            })}
                          </div>
                          <p className="text-xs text-muted-foreground">Greyed out slots are booked or unavailable.</p>
                        </>
                      )}
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" className="rounded-xl" onClick={() => setStep('service')}>Back</Button>
                    <Button className="flex-1 rounded-xl btn-3d" disabled={!selectedDate || !selectedTime} onClick={() => setStep('info')}>Continue</Button>
                  </div>
                </div>
              )}

              {step === 'info' && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-foreground">Your Details</h2>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>Full Name</Label>
                      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="John Smith" className="rounded-xl" />
                    </div>
                    <PhoneInput
                      label="Phone"
                      value={phone}
                      onChange={(val) => setPhone(val)}
                      required
                    />
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@email.com" className="rounded-xl" />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" className="rounded-xl" onClick={() => setStep('time')}>Back</Button>
                    <Button
                      className="flex-1 rounded-xl btn-3d shadow-primary-glow"
                      disabled={!name || !phone || createBooking.isPending}
                      onClick={handleBook}
                    >
                      {createBooking.isPending ? 'Booking...' : 'Confirm Booking'}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
