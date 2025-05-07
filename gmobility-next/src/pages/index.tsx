import Image from 'next/image';
import Link from 'next/link';
import styles from '@/styles/Landing.module.css';

export default function LandingPage() {
    return (
        <div>
            <div className={styles['logo-container']}>
                <Image src="/glogo.png" alt="Gmobility Logo" className={styles.logo} width={160} height={160} />
            </div>
            <div className={styles['main-container']}>
                <div className={styles['mainpage-content']}>
                    <Image src="/gif.gif" alt="GIF Description" className={styles['bottom-left-gif']} width={1000} height={800} unoptimized />
                </div>
            </div>
            <div className={styles['heading-container']}>
                <h1>WELCOME</h1>
            </div>
            <div className={styles['heading2-container']}>
                <h6>TO GMOBILITY'S STAFF PORTAL</h6>
            </div>
            <Link href="/login" className={styles['login-text']}>
                Login
            </Link>
        </div>
    );
} 