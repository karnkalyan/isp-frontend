"use client"
import {useParams} from 'next/navigation';
import {DeviceSessionProvider} from '@/contexts/DeviceSessionContext';
export default function DeviceLayout({children}:{children:React.ReactNode}){const params=useParams<{deviceId:string}>(),deviceId=Number(params.deviceId);return Number.isInteger(deviceId)?<DeviceSessionProvider deviceId={deviceId}>{children}</DeviceSessionProvider>:children}
