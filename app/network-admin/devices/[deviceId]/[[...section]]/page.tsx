"use client"
import {useParams} from 'next/navigation';import {NetworkAdminShell} from '@/components/device-management/network-admin-shell';
export default function NetworkDeviceAdminPage(){const params=useParams<{deviceId:string;section?:string[]}>(),deviceId=Number(params.deviceId),section=Array.isArray(params.section)?params.section:['overview'];if(!Number.isInteger(deviceId))return <div className="p-8">Invalid device ID.</div>;return <NetworkAdminShell deviceId={deviceId} sectionPath={section}/>}
