import { ImageResponse } from 'next/og'
import { readFileSync } from 'fs'
import { join } from 'path'

export const runtime = 'nodejs'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'SoftwareYard - IT Solutions For Growing Your Business'

export default function Image() {
  const logoBase64 = readFileSync(join(process.cwd(), 'public', 'logo.png')).toString('base64')
  const logoSrc = `data:image/png;base64,${logoBase64}`

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#0a0a0a',
          padding: '72px',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -140,
            left: -100,
            width: 520,
            height: 520,
            borderRadius: '50%',
            backgroundImage:
              'radial-gradient(circle, rgba(155,138,251,0.55) 0%, rgba(155,138,251,0) 70%)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -160,
            right: -80,
            width: 560,
            height: 560,
            borderRadius: '50%',
            backgroundImage:
              'radial-gradient(circle, rgba(224,105,196,0.45) 0%, rgba(224,105,196,0) 70%)',
            display: 'flex',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              backgroundColor: '#fafafa',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoSrc} width={38} height={38} alt="" />
          </div>
          <span style={{ fontSize: 32, fontWeight: 700, color: '#fafafa' }}>
            SoftwareYard
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              fontSize: 68,
              fontWeight: 700,
              lineHeight: 1.15,
              color: '#fafafa',
              maxWidth: 920,
            }}
          >
            <span style={{ marginRight: 20 }}>IT Solutions</span>
            <span
              style={{
                marginRight: 20,
                backgroundImage: 'linear-gradient(135deg, #9b8afb, #e069c4)',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              For Growing
            </span>
            <span>Your Business</span>
          </div>
          <span style={{ fontSize: 28, color: 'rgba(250,250,250,0.6)', display: 'flex' }}>
            softwareyard.co
          </span>
        </div>
      </div>
    ),
    { ...size }
  )
}
