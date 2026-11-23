import React from 'react';
import { View, Text, TextStyle, ViewStyle, StyleSheet } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { ms } from '../../theme/responsive';

export interface AppIconProps {
  name: string;
  size?: number;
  color?: string;
  style?: TextStyle | ViewStyle;
}

/**
 * Universal 1.8px Precision Vector Line Icon Component
 * Matches the reference image's minimal line aesthetic.
 * Pure vector geometries ensure 100% visibility on all devices without font linking risks.
 */
export const AppIcon: React.FC<AppIconProps> = ({
  name,
  size = 20,
  color = '#111827',
  style,
}) => {
  const scaledSize = ms(size);
  const stroke = 1.8;

  // 1. User / Person Profile Icon (Matching Top-Right profile circle from image)
  if (name === 'person' || name === 'user') {
    const headSize = Math.round(scaledSize * 0.36);
    const bodyWidth = Math.round(scaledSize * 0.72);
    const bodyHeight = Math.round(scaledSize * 0.34);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        {/* Head */}
        <View
          style={{
            width: headSize,
            height: headSize,
            borderRadius: headSize / 2,
            borderWidth: stroke,
            borderColor: color,
            marginBottom: ms(2),
          }}
        />
        {/* Curved Shoulder / Body */}
        <View
          style={{
            width: bodyWidth,
            height: bodyHeight,
            borderTopLeftRadius: bodyWidth / 2,
            borderTopRightRadius: bodyWidth / 2,
            borderWidth: stroke,
            borderBottomWidth: 0,
            borderColor: color,
          }}
        />
      </View>
    );
  }

  // 2. Lock Icon (Matching Security Inputs)
  if (name === 'lock') {
    const bodyW = Math.round(scaledSize * 0.7);
    const bodyH = Math.round(scaledSize * 0.52);
    const shackleW = Math.round(scaledSize * 0.44);
    const shackleH = Math.round(scaledSize * 0.42);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        {/* Shackle */}
        <View
          style={{
            width: shackleW,
            height: shackleH,
            borderWidth: stroke,
            borderBottomWidth: 0,
            borderTopLeftRadius: shackleW / 2,
            borderTopRightRadius: shackleW / 2,
            borderColor: color,
            marginBottom: -ms(1),
          }}
        />
        {/* Body */}
        <View
          style={{
            width: bodyW,
            height: bodyH,
            borderWidth: stroke,
            borderRadius: ms(3),
            borderColor: color,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View style={{ width: stroke * 1.5, height: stroke * 2.5, backgroundColor: color }} />
        </View>
      </View>
    );
  }

  // 3. Eye / Eye-Off (Password Visibility) - Clean Circular Aesthetic
  if (name === 'eye') {
    const outerRadius = Math.round(scaledSize * 0.44);
    const pupilRadius = Math.round(scaledSize * 0.16);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        {/* Circular Outer Iris / Eye Ring */}
        <View
          style={{
            width: outerRadius * 2,
            height: outerRadius * 2,
            borderRadius: outerRadius,
            borderWidth: stroke,
            borderColor: color,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Centered Pupil */}
          <View
            style={{
              width: pupilRadius * 2,
              height: pupilRadius * 2,
              borderRadius: pupilRadius,
              backgroundColor: color,
            }}
          />
        </View>
      </View>
    );
  }

  // Identity / Aadhaar Card
  if (name === 'id-card' || name === 'aadhaar-card' || name === 'badge') {
    const cardW = Math.round(scaledSize * 0.88);
    const cardH = Math.round(scaledSize * 0.62);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View
          style={{
            width: cardW,
            height: cardH,
            borderWidth: stroke,
            borderRadius: ms(3),
            borderColor: color,
            padding: ms(2),
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Avatar on left */}
          <View
            style={{
              width: Math.round(cardH * 0.65),
              height: Math.round(cardH * 0.65),
              borderRadius: ms(2),
              borderWidth: stroke * 0.9,
              borderColor: color,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View style={{ width: ms(4), height: ms(4), borderRadius: ms(2), backgroundColor: color, marginBottom: 1 }} />
            <View style={{ width: ms(7), height: ms(3), borderTopLeftRadius: ms(3), borderTopRightRadius: ms(3), backgroundColor: color }} />
          </View>
          {/* Text lines on right */}
          <View style={{ flex: 1, paddingLeft: ms(4), justifyContent: 'space-around', height: '80%' }}>
            <View style={{ width: '85%', height: stroke * 0.9, backgroundColor: color }} />
            <View style={{ width: '65%', height: stroke * 0.9, backgroundColor: color }} />
            <View style={{ width: '95%', height: stroke * 0.9, backgroundColor: color }} />
          </View>
        </View>
      </View>
    );
  }

  // PAN Card (Tax card with chip & number)
  if (name === 'pan-card') {
    const cardW = Math.round(scaledSize * 0.88);
    const cardH = Math.round(scaledSize * 0.62);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View
          style={{
            width: cardW,
            height: cardH,
            borderWidth: stroke,
            borderRadius: ms(3),
            borderColor: color,
            padding: ms(3),
            justifyContent: 'space-between',
          }}
        >
          {/* Header strip */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ width: '40%', height: stroke * 1.1, backgroundColor: color }} />
            <View style={{ width: ms(6), height: ms(5), borderWidth: stroke * 0.8, borderColor: color, borderRadius: 1 }} />
          </View>
          {/* Number stripe */}
          <View style={{ width: '80%', height: stroke * 1.2, backgroundColor: color }} />
          {/* Bottom signature line */}
          <View style={{ width: '50%', height: stroke * 0.9, backgroundColor: color }} />
        </View>
      </View>
    );
  }

  // Bank Passbook (Booklet / Ledger)
  if (name === 'bank-passbook' || name === 'passbook') {
    const bW = Math.round(scaledSize * 0.84);
    const bH = Math.round(scaledSize * 0.68);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View
          style={{
            width: bW,
            height: bH,
            borderWidth: stroke,
            borderRadius: ms(3),
            borderColor: color,
            padding: ms(3),
            justifyContent: 'space-between',
          }}
        >
          {/* Top header fold / bank title */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ width: '50%', height: stroke * 1.2, backgroundColor: color }} />
            {/* Small bank pillar icon */}
            <View style={{ flexDirection: 'row', gap: 1 }}>
              <View style={{ width: 1.5, height: ms(4), backgroundColor: color }} />
              <View style={{ width: 1.5, height: ms(4), backgroundColor: color }} />
              <View style={{ width: 1.5, height: ms(4), backgroundColor: color }} />
            </View>
          </View>
          {/* Account line */}
          <View style={{ width: '85%', height: stroke * 0.9, backgroundColor: color }} />
          {/* Ledger transaction rows */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ width: '35%', height: stroke * 0.8, backgroundColor: color }} />
            <View style={{ width: '40%', height: stroke * 0.8, backgroundColor: color }} />
          </View>
        </View>
      </View>
    );
  }

  // Passport Size Photo
  if (name === 'passport-photo' || name === 'photo-frame') {
    const fSize = Math.round(scaledSize * 0.76);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View
          style={{
            width: fSize,
            height: fSize,
            borderWidth: stroke,
            borderRadius: ms(3),
            borderColor: color,
            alignItems: 'center',
            justifyContent: 'center',
            paddingBottom: ms(2),
          }}
        >
          {/* Head */}
          <View
            style={{
              width: ms(8),
              height: ms(8),
              borderRadius: ms(4),
              borderWidth: stroke * 0.9,
              borderColor: color,
              marginBottom: 1,
            }}
          />
          {/* Shoulders */}
          <View
            style={{
              width: ms(13),
              height: ms(6),
              borderTopLeftRadius: ms(6),
              borderTopRightRadius: ms(6),
              borderWidth: stroke * 0.9,
              borderBottomWidth: 0,
              borderColor: color,
            }}
          />
        </View>
      </View>
    );
  }

  // Police Clearance Badge / Shield
  if (name === 'police-shield' || name === 'police') {
    const sW = Math.round(scaledSize * 0.8);
    const sH = Math.round(scaledSize * 0.88);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View
          style={{
            width: sW,
            height: sH,
            borderWidth: stroke,
            borderColor: color,
            borderTopLeftRadius: sW * 0.5,
            borderTopRightRadius: sW * 0.5,
            borderBottomLeftRadius: sW * 0.55,
            borderBottomRightRadius: sW * 0.55,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Central Star Badge */}
          <View
            style={{
              width: ms(7),
              height: ms(7),
              borderWidth: stroke * 0.8,
              borderColor: color,
              transform: [{ rotate: '45deg' }],
            }}
          />
        </View>
      </View>
    );
  }

  // Joining Form / Contract
  if (name === 'joining-form' || name === 'agreement') {
    const dW = Math.round(scaledSize * 0.68);
    const dH = Math.round(scaledSize * 0.84);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View
          style={{
            width: dW,
            height: dH,
            borderWidth: stroke,
            borderRadius: ms(3),
            borderColor: color,
            padding: ms(3),
            justifyContent: 'space-between',
          }}
        >
          <View style={{ width: '80%', height: stroke, backgroundColor: color }} />
          <View style={{ width: '60%', height: stroke, backgroundColor: color }} />
          <View style={{ width: '90%', height: stroke, backgroundColor: color }} />
          {/* Signature mark at bottom */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
            <View style={{ width: ms(8), height: stroke, backgroundColor: color }} />
            <View style={{ width: ms(4), height: ms(4), borderRadius: ms(2), borderWidth: stroke * 0.8, borderColor: color }} />
          </View>
        </View>
      </View>
    );
  }


  if (name === 'eyeOff' || name === 'eye-off') {
    const outerRadius = Math.round(scaledSize * 0.44);
    const pupilRadius = Math.round(scaledSize * 0.16);
    const slashLength = Math.round(scaledSize * 1.05);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        {/* Circular Outer Iris / Eye Ring */}
        <View
          style={{
            width: outerRadius * 2,
            height: outerRadius * 2,
            borderRadius: outerRadius,
            borderWidth: stroke,
            borderColor: color,
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          {/* Faded Pupil */}
          <View
            style={{
              width: pupilRadius * 2,
              height: pupilRadius * 2,
              borderRadius: pupilRadius,
              backgroundColor: color,
              opacity: 0.7,
            }}
          />
          {/* Crisp Diagonal Slash Line */}
          <View
            style={{
              position: 'absolute',
              width: slashLength,
              height: stroke,
              backgroundColor: color,
              transform: [{ rotate: '-45deg' }],
            }}
          />
        </View>
      </View>
    );
  }

  // Identity / Aadhaar Card
  if (name === 'id-card' || name === 'aadhaar-card' || name === 'badge') {
    const cardW = Math.round(scaledSize * 0.88);
    const cardH = Math.round(scaledSize * 0.62);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View
          style={{
            width: cardW,
            height: cardH,
            borderWidth: stroke,
            borderRadius: ms(3),
            borderColor: color,
            padding: ms(2),
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Avatar on left */}
          <View
            style={{
              width: Math.round(cardH * 0.65),
              height: Math.round(cardH * 0.65),
              borderRadius: ms(2),
              borderWidth: stroke * 0.9,
              borderColor: color,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View style={{ width: ms(4), height: ms(4), borderRadius: ms(2), backgroundColor: color, marginBottom: 1 }} />
            <View style={{ width: ms(7), height: ms(3), borderTopLeftRadius: ms(3), borderTopRightRadius: ms(3), backgroundColor: color }} />
          </View>
          {/* Text lines on right */}
          <View style={{ flex: 1, paddingLeft: ms(4), justifyContent: 'space-around', height: '80%' }}>
            <View style={{ width: '85%', height: stroke * 0.9, backgroundColor: color }} />
            <View style={{ width: '65%', height: stroke * 0.9, backgroundColor: color }} />
            <View style={{ width: '95%', height: stroke * 0.9, backgroundColor: color }} />
          </View>
        </View>
      </View>
    );
  }

  // PAN Card (Tax card with chip & number)
  if (name === 'pan-card') {
    const cardW = Math.round(scaledSize * 0.88);
    const cardH = Math.round(scaledSize * 0.62);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View
          style={{
            width: cardW,
            height: cardH,
            borderWidth: stroke,
            borderRadius: ms(3),
            borderColor: color,
            padding: ms(3),
            justifyContent: 'space-between',
          }}
        >
          {/* Header strip */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ width: '40%', height: stroke * 1.1, backgroundColor: color }} />
            <View style={{ width: ms(6), height: ms(5), borderWidth: stroke * 0.8, borderColor: color, borderRadius: 1 }} />
          </View>
          {/* Number stripe */}
          <View style={{ width: '80%', height: stroke * 1.2, backgroundColor: color }} />
          {/* Bottom signature line */}
          <View style={{ width: '50%', height: stroke * 0.9, backgroundColor: color }} />
        </View>
      </View>
    );
  }

  // Bank Passbook (Booklet / Ledger)
  if (name === 'bank-passbook' || name === 'passbook') {
    const bW = Math.round(scaledSize * 0.84);
    const bH = Math.round(scaledSize * 0.68);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View
          style={{
            width: bW,
            height: bH,
            borderWidth: stroke,
            borderRadius: ms(3),
            borderColor: color,
            padding: ms(3),
            justifyContent: 'space-between',
          }}
        >
          {/* Top header fold / bank title */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ width: '50%', height: stroke * 1.2, backgroundColor: color }} />
            {/* Small bank pillar icon */}
            <View style={{ flexDirection: 'row', gap: 1 }}>
              <View style={{ width: 1.5, height: ms(4), backgroundColor: color }} />
              <View style={{ width: 1.5, height: ms(4), backgroundColor: color }} />
              <View style={{ width: 1.5, height: ms(4), backgroundColor: color }} />
            </View>
          </View>
          {/* Account line */}
          <View style={{ width: '85%', height: stroke * 0.9, backgroundColor: color }} />
          {/* Ledger transaction rows */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ width: '35%', height: stroke * 0.8, backgroundColor: color }} />
            <View style={{ width: '40%', height: stroke * 0.8, backgroundColor: color }} />
          </View>
        </View>
      </View>
    );
  }

  // Passport Size Photo
  if (name === 'passport-photo' || name === 'photo-frame') {
    const fSize = Math.round(scaledSize * 0.76);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View
          style={{
            width: fSize,
            height: fSize,
            borderWidth: stroke,
            borderRadius: ms(3),
            borderColor: color,
            alignItems: 'center',
            justifyContent: 'center',
            paddingBottom: ms(2),
          }}
        >
          {/* Head */}
          <View
            style={{
              width: ms(8),
              height: ms(8),
              borderRadius: ms(4),
              borderWidth: stroke * 0.9,
              borderColor: color,
              marginBottom: 1,
            }}
          />
          {/* Shoulders */}
          <View
            style={{
              width: ms(13),
              height: ms(6),
              borderTopLeftRadius: ms(6),
              borderTopRightRadius: ms(6),
              borderWidth: stroke * 0.9,
              borderBottomWidth: 0,
              borderColor: color,
            }}
          />
        </View>
      </View>
    );
  }

  // Police Clearance Badge / Shield
  if (name === 'police-shield' || name === 'police') {
    const sW = Math.round(scaledSize * 0.8);
    const sH = Math.round(scaledSize * 0.88);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View
          style={{
            width: sW,
            height: sH,
            borderWidth: stroke,
            borderColor: color,
            borderTopLeftRadius: sW * 0.5,
            borderTopRightRadius: sW * 0.5,
            borderBottomLeftRadius: sW * 0.55,
            borderBottomRightRadius: sW * 0.55,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Central Star Badge */}
          <View
            style={{
              width: ms(7),
              height: ms(7),
              borderWidth: stroke * 0.8,
              borderColor: color,
              transform: [{ rotate: '45deg' }],
            }}
          />
        </View>
      </View>
    );
  }

  // Joining Form / Contract
  if (name === 'joining-form' || name === 'agreement') {
    const dW = Math.round(scaledSize * 0.68);
    const dH = Math.round(scaledSize * 0.84);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View
          style={{
            width: dW,
            height: dH,
            borderWidth: stroke,
            borderRadius: ms(3),
            borderColor: color,
            padding: ms(3),
            justifyContent: 'space-between',
          }}
        >
          <View style={{ width: '80%', height: stroke, backgroundColor: color }} />
          <View style={{ width: '60%', height: stroke, backgroundColor: color }} />
          <View style={{ width: '90%', height: stroke, backgroundColor: color }} />
          {/* Signature mark at bottom */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
            <View style={{ width: ms(8), height: stroke, backgroundColor: color }} />
            <View style={{ width: ms(4), height: ms(4), borderRadius: ms(2), borderWidth: stroke * 0.8, borderColor: color }} />
          </View>
        </View>
      </View>
    );
  }


  // 4. Shield Icon (Security / App Branding)
  if (
    name === 'shield' ||
    name === 'shield-check' ||
    name === 'shield-checkmark' ||
    name === 'shieldCheck' ||
    name === 'security'
  ) {
    const sWidth = Math.round(scaledSize * 0.78);
    const sHeight = Math.round(scaledSize * 0.88);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View
          style={{
            width: sWidth,
            height: sHeight,
            borderWidth: stroke,
            borderColor: color,
            borderTopLeftRadius: sWidth * 0.45,
            borderTopRightRadius: sWidth * 0.45,
            borderBottomLeftRadius: sWidth * 0.6,
            borderBottomRightRadius: sWidth * 0.6,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'transparent',
          }}
        >
          <View
            style={{
              width: sWidth * 0.35,
              height: sHeight * 0.2,
              borderLeftWidth: stroke,
              borderBottomWidth: stroke,
              borderColor: color,
              transform: [{ rotate: '-45deg' }, { translateY: -sHeight * 0.05 }],
            }}
          />
        </View>
      </View>
    );
  }

  // Identity / Aadhaar Card
  if (name === 'id-card' || name === 'aadhaar-card' || name === 'badge') {
    const cardW = Math.round(scaledSize * 0.88);
    const cardH = Math.round(scaledSize * 0.62);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View
          style={{
            width: cardW,
            height: cardH,
            borderWidth: stroke,
            borderRadius: ms(3),
            borderColor: color,
            padding: ms(2),
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Avatar on left */}
          <View
            style={{
              width: Math.round(cardH * 0.65),
              height: Math.round(cardH * 0.65),
              borderRadius: ms(2),
              borderWidth: stroke * 0.9,
              borderColor: color,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View style={{ width: ms(4), height: ms(4), borderRadius: ms(2), backgroundColor: color, marginBottom: 1 }} />
            <View style={{ width: ms(7), height: ms(3), borderTopLeftRadius: ms(3), borderTopRightRadius: ms(3), backgroundColor: color }} />
          </View>
          {/* Text lines on right */}
          <View style={{ flex: 1, paddingLeft: ms(4), justifyContent: 'space-around', height: '80%' }}>
            <View style={{ width: '85%', height: stroke * 0.9, backgroundColor: color }} />
            <View style={{ width: '65%', height: stroke * 0.9, backgroundColor: color }} />
            <View style={{ width: '95%', height: stroke * 0.9, backgroundColor: color }} />
          </View>
        </View>
      </View>
    );
  }

  // PAN Card (Tax card with chip & number)
  if (name === 'pan-card') {
    const cardW = Math.round(scaledSize * 0.88);
    const cardH = Math.round(scaledSize * 0.62);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View
          style={{
            width: cardW,
            height: cardH,
            borderWidth: stroke,
            borderRadius: ms(3),
            borderColor: color,
            padding: ms(3),
            justifyContent: 'space-between',
          }}
        >
          {/* Header strip */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ width: '40%', height: stroke * 1.1, backgroundColor: color }} />
            <View style={{ width: ms(6), height: ms(5), borderWidth: stroke * 0.8, borderColor: color, borderRadius: 1 }} />
          </View>
          {/* Number stripe */}
          <View style={{ width: '80%', height: stroke * 1.2, backgroundColor: color }} />
          {/* Bottom signature line */}
          <View style={{ width: '50%', height: stroke * 0.9, backgroundColor: color }} />
        </View>
      </View>
    );
  }

  // Bank Passbook (Booklet / Ledger)
  if (name === 'bank-passbook' || name === 'passbook') {
    const bW = Math.round(scaledSize * 0.84);
    const bH = Math.round(scaledSize * 0.68);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View
          style={{
            width: bW,
            height: bH,
            borderWidth: stroke,
            borderRadius: ms(3),
            borderColor: color,
            padding: ms(3),
            justifyContent: 'space-between',
          }}
        >
          {/* Top header fold / bank title */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ width: '50%', height: stroke * 1.2, backgroundColor: color }} />
            {/* Small bank pillar icon */}
            <View style={{ flexDirection: 'row', gap: 1 }}>
              <View style={{ width: 1.5, height: ms(4), backgroundColor: color }} />
              <View style={{ width: 1.5, height: ms(4), backgroundColor: color }} />
              <View style={{ width: 1.5, height: ms(4), backgroundColor: color }} />
            </View>
          </View>
          {/* Account line */}
          <View style={{ width: '85%', height: stroke * 0.9, backgroundColor: color }} />
          {/* Ledger transaction rows */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ width: '35%', height: stroke * 0.8, backgroundColor: color }} />
            <View style={{ width: '40%', height: stroke * 0.8, backgroundColor: color }} />
          </View>
        </View>
      </View>
    );
  }

  // Passport Size Photo
  if (name === 'passport-photo' || name === 'photo-frame') {
    const fSize = Math.round(scaledSize * 0.76);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View
          style={{
            width: fSize,
            height: fSize,
            borderWidth: stroke,
            borderRadius: ms(3),
            borderColor: color,
            alignItems: 'center',
            justifyContent: 'center',
            paddingBottom: ms(2),
          }}
        >
          {/* Head */}
          <View
            style={{
              width: ms(8),
              height: ms(8),
              borderRadius: ms(4),
              borderWidth: stroke * 0.9,
              borderColor: color,
              marginBottom: 1,
            }}
          />
          {/* Shoulders */}
          <View
            style={{
              width: ms(13),
              height: ms(6),
              borderTopLeftRadius: ms(6),
              borderTopRightRadius: ms(6),
              borderWidth: stroke * 0.9,
              borderBottomWidth: 0,
              borderColor: color,
            }}
          />
        </View>
      </View>
    );
  }

  // Police Clearance Badge / Shield
  if (name === 'police-shield' || name === 'police') {
    const sW = Math.round(scaledSize * 0.8);
    const sH = Math.round(scaledSize * 0.88);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View
          style={{
            width: sW,
            height: sH,
            borderWidth: stroke,
            borderColor: color,
            borderTopLeftRadius: sW * 0.5,
            borderTopRightRadius: sW * 0.5,
            borderBottomLeftRadius: sW * 0.55,
            borderBottomRightRadius: sW * 0.55,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Central Star Badge */}
          <View
            style={{
              width: ms(7),
              height: ms(7),
              borderWidth: stroke * 0.8,
              borderColor: color,
              transform: [{ rotate: '45deg' }],
            }}
          />
        </View>
      </View>
    );
  }

  // Joining Form / Contract
  if (name === 'joining-form' || name === 'agreement') {
    const dW = Math.round(scaledSize * 0.68);
    const dH = Math.round(scaledSize * 0.84);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View
          style={{
            width: dW,
            height: dH,
            borderWidth: stroke,
            borderRadius: ms(3),
            borderColor: color,
            padding: ms(3),
            justifyContent: 'space-between',
          }}
        >
          <View style={{ width: '80%', height: stroke, backgroundColor: color }} />
          <View style={{ width: '60%', height: stroke, backgroundColor: color }} />
          <View style={{ width: '90%', height: stroke, backgroundColor: color }} />
          {/* Signature mark at bottom */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
            <View style={{ width: ms(8), height: stroke, backgroundColor: color }} />
            <View style={{ width: ms(4), height: ms(4), borderRadius: ms(2), borderWidth: stroke * 0.8, borderColor: color }} />
          </View>
        </View>
      </View>
    );
  }


  // Identity / Aadhaar Card
  if (name === 'id-card' || name === 'aadhaar-card' || name === 'badge') {
    const cardW = Math.round(scaledSize * 0.88);
    const cardH = Math.round(scaledSize * 0.62);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View
          style={{
            width: cardW,
            height: cardH,
            borderWidth: stroke,
            borderRadius: ms(3),
            borderColor: color,
            padding: ms(2),
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Avatar on left */}
          <View
            style={{
              width: Math.round(cardH * 0.65),
              height: Math.round(cardH * 0.65),
              borderRadius: ms(2),
              borderWidth: stroke * 0.9,
              borderColor: color,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View style={{ width: ms(4), height: ms(4), borderRadius: ms(2), backgroundColor: color, marginBottom: 1 }} />
            <View style={{ width: ms(7), height: ms(3), borderTopLeftRadius: ms(3), borderTopRightRadius: ms(3), backgroundColor: color }} />
          </View>
          {/* Text lines on right */}
          <View style={{ flex: 1, paddingLeft: ms(4), justifyContent: 'space-around', height: '80%' }}>
            <View style={{ width: '85%', height: stroke * 0.9, backgroundColor: color }} />
            <View style={{ width: '65%', height: stroke * 0.9, backgroundColor: color }} />
            <View style={{ width: '95%', height: stroke * 0.9, backgroundColor: color }} />
          </View>
        </View>
      </View>
    );
  }

  // PAN Card (Tax card with chip & number)
  if (name === 'pan-card') {
    const cardW = Math.round(scaledSize * 0.88);
    const cardH = Math.round(scaledSize * 0.62);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View
          style={{
            width: cardW,
            height: cardH,
            borderWidth: stroke,
            borderRadius: ms(3),
            borderColor: color,
            padding: ms(3),
            justifyContent: 'space-between',
          }}
        >
          {/* Header strip */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ width: '40%', height: stroke * 1.1, backgroundColor: color }} />
            <View style={{ width: ms(6), height: ms(5), borderWidth: stroke * 0.8, borderColor: color, borderRadius: 1 }} />
          </View>
          {/* Number stripe */}
          <View style={{ width: '80%', height: stroke * 1.2, backgroundColor: color }} />
          {/* Bottom signature line */}
          <View style={{ width: '50%', height: stroke * 0.9, backgroundColor: color }} />
        </View>
      </View>
    );
  }

  // Bank Passbook (Booklet / Ledger)
  if (name === 'bank-passbook' || name === 'passbook') {
    const bW = Math.round(scaledSize * 0.84);
    const bH = Math.round(scaledSize * 0.68);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View
          style={{
            width: bW,
            height: bH,
            borderWidth: stroke,
            borderRadius: ms(3),
            borderColor: color,
            padding: ms(3),
            justifyContent: 'space-between',
          }}
        >
          {/* Top header fold / bank title */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ width: '50%', height: stroke * 1.2, backgroundColor: color }} />
            {/* Small bank pillar icon */}
            <View style={{ flexDirection: 'row', gap: 1 }}>
              <View style={{ width: 1.5, height: ms(4), backgroundColor: color }} />
              <View style={{ width: 1.5, height: ms(4), backgroundColor: color }} />
              <View style={{ width: 1.5, height: ms(4), backgroundColor: color }} />
            </View>
          </View>
          {/* Account line */}
          <View style={{ width: '85%', height: stroke * 0.9, backgroundColor: color }} />
          {/* Ledger transaction rows */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ width: '35%', height: stroke * 0.8, backgroundColor: color }} />
            <View style={{ width: '40%', height: stroke * 0.8, backgroundColor: color }} />
          </View>
        </View>
      </View>
    );
  }

  // Passport Size Photo
  if (name === 'passport-photo' || name === 'photo-frame') {
    const fSize = Math.round(scaledSize * 0.76);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View
          style={{
            width: fSize,
            height: fSize,
            borderWidth: stroke,
            borderRadius: ms(3),
            borderColor: color,
            alignItems: 'center',
            justifyContent: 'center',
            paddingBottom: ms(2),
          }}
        >
          {/* Head */}
          <View
            style={{
              width: ms(8),
              height: ms(8),
              borderRadius: ms(4),
              borderWidth: stroke * 0.9,
              borderColor: color,
              marginBottom: 1,
            }}
          />
          {/* Shoulders */}
          <View
            style={{
              width: ms(13),
              height: ms(6),
              borderTopLeftRadius: ms(6),
              borderTopRightRadius: ms(6),
              borderWidth: stroke * 0.9,
              borderBottomWidth: 0,
              borderColor: color,
            }}
          />
        </View>
      </View>
    );
  }

  // Police Clearance Badge / Shield
  if (name === 'police-shield' || name === 'police') {
    const sW = Math.round(scaledSize * 0.8);
    const sH = Math.round(scaledSize * 0.88);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View
          style={{
            width: sW,
            height: sH,
            borderWidth: stroke,
            borderColor: color,
            borderTopLeftRadius: sW * 0.5,
            borderTopRightRadius: sW * 0.5,
            borderBottomLeftRadius: sW * 0.55,
            borderBottomRightRadius: sW * 0.55,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Central Star Badge */}
          <View
            style={{
              width: ms(7),
              height: ms(7),
              borderWidth: stroke * 0.8,
              borderColor: color,
              transform: [{ rotate: '45deg' }],
            }}
          />
        </View>
      </View>
    );
  }

  // Joining Form / Contract
  if (name === 'joining-form' || name === 'agreement') {
    const dW = Math.round(scaledSize * 0.68);
    const dH = Math.round(scaledSize * 0.84);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View
          style={{
            width: dW,
            height: dH,
            borderWidth: stroke,
            borderRadius: ms(3),
            borderColor: color,
            padding: ms(3),
            justifyContent: 'space-between',
          }}
        >
          <View style={{ width: '80%', height: stroke, backgroundColor: color }} />
          <View style={{ width: '60%', height: stroke, backgroundColor: color }} />
          <View style={{ width: '90%', height: stroke, backgroundColor: color }} />
          {/* Signature mark at bottom */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
            <View style={{ width: ms(8), height: stroke, backgroundColor: color }} />
            <View style={{ width: ms(4), height: ms(4), borderRadius: ms(2), borderWidth: stroke * 0.8, borderColor: color }} />
          </View>
        </View>
      </View>
    );
  }

  // 5. Audit / Document / File-Text / Terms / Privacy / Legal
  if (
    name === 'audit' ||
    name === 'clipboard' ||
    name === 'document' ||
    name === 'document-text' ||
    name === 'file-text' ||
    name === 'receipt' ||
    name === 'terms' ||
    name === 'policy' ||
    name === 'privacy' ||
    name === 'legal'
  ) {
    const docW = Math.round(scaledSize * 0.65);
    const docH = Math.round(scaledSize * 0.82);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View
          style={{
            width: docW,
            height: docH,
            borderWidth: stroke,
            borderRadius: ms(3),
            borderColor: color,
            padding: ms(3),
            justifyContent: 'space-around',
          }}
        >
          <View style={{ width: '80%', height: stroke, backgroundColor: color }} />
          <View style={{ width: '60%', height: stroke, backgroundColor: color }} />
          <View style={{ width: '40%', height: stroke, backgroundColor: color }} />
        </View>
      </View>
    );
  }

  // 6. Calendar
  if (name === 'calendar') {
    const calW = Math.round(scaledSize * 0.75);
    const calH = Math.round(scaledSize * 0.72);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View
          style={{
            width: calW,
            height: calH,
            borderWidth: stroke,
            borderRadius: ms(4),
            borderColor: color,
            position: 'relative',
          }}
        >
          {/* Top header bar */}
          <View style={{ width: '100%', height: calH * 0.3, borderBottomWidth: stroke, borderColor: color }} />
          {/* Calendar dots */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: ms(3) }}>
            <View style={{ width: ms(3), height: ms(3), borderRadius: ms(1.5), backgroundColor: color }} />
            <View style={{ width: ms(3), height: ms(3), borderRadius: ms(1.5), backgroundColor: color }} />
          </View>
        </View>
      </View>
    );
  }

  // 7. Location / Map Pin (Pure vector precision pin)
  if (name === 'location' || name === 'map-pin' || name === 'gps' || name === 'pin') {
    const pinW = Math.round(scaledSize * 0.58);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View
          style={{
            width: pinW,
            height: pinW,
            borderRadius: pinW / 2,
            borderWidth: stroke,
            borderColor: color,
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2,
          }}
        >
          <View
            style={{
              width: pinW * 0.36,
              height: pinW * 0.36,
              borderRadius: (pinW * 0.36) / 2,
              backgroundColor: color,
            }}
          />
        </View>
        <View
          style={{
            width: pinW * 0.44,
            height: pinW * 0.44,
            borderRightWidth: stroke,
            borderBottomWidth: stroke,
            borderColor: color,
            transform: [{ rotate: '45deg' }],
            marginTop: -pinW * 0.22,
            zIndex: 1,
          }}
        />
      </View>
    );
  }

  // Check / Verified Badge Icon (Feather vector check-circle with safe fallback)
  if (name === 'check-circle' || name === 'checkCircle' || name === 'verified' || name === 'shield-check') {
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View
          style={{
            width: scaledSize * 0.85,
            height: scaledSize * 0.85,
            borderRadius: (scaledSize * 0.85) / 2,
            borderWidth: stroke,
            borderColor: color,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View
            style={{
              width: scaledSize * 0.36,
              height: scaledSize * 0.22,
              borderLeftWidth: stroke,
              borderBottomWidth: stroke,
              borderColor: color,
              transform: [{ rotate: '-45deg' }, { translateY: -ms(1) }],
            }}
          />
        </View>
      </View>
    );
  }

  // 7b. Fingerprint / Biometric Radar
  if (name === 'fingerprint') {
    const fSize = Math.round(scaledSize * 0.78);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View
          style={{
            width: fSize,
            height: fSize,
            borderRadius: fSize / 2,
            borderWidth: stroke,
            borderColor: color,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View
            style={{
              width: fSize * 0.52,
              height: fSize * 0.52,
              borderRadius: (fSize * 0.52) / 2,
              borderWidth: stroke,
              borderColor: color,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View style={{ width: stroke * 1.5, height: stroke * 1.5, borderRadius: stroke, backgroundColor: color }} />
          </View>
        </View>
      </View>
    );
  }

  // Clock / Time Icon (Pure vector geometry)
  if (name === 'clock' || name === 'time') {
    const cSize = Math.round(scaledSize * 0.86);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View
          style={{
            width: cSize,
            height: cSize,
            borderRadius: cSize / 2,
            borderWidth: stroke,
            borderColor: color,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View
            style={{
              position: 'absolute',
              width: stroke,
              height: cSize * 0.28,
              backgroundColor: color,
              top: cSize * 0.22,
              borderRadius: stroke / 2,
            }}
          />
          <View
            style={{
              position: 'absolute',
              height: stroke,
              width: cSize * 0.24,
              backgroundColor: color,
              left: cSize * 0.5 - stroke / 2,
              borderRadius: stroke / 2,
            }}
          />
          <View
            style={{
              width: stroke * 1.5,
              height: stroke * 1.5,
              borderRadius: stroke,
              backgroundColor: color,
            }}
          />
        </View>
      </View>
    );
  }

  // Arrow In / Log In / Check-in Icon
  if (name === 'arrow-in' || name === 'log-in' || name === 'punch-in') {
    const s = Math.round(scaledSize * 0.75);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View style={{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }}>
          {/* Down-Right / In Arrow */}
          <View style={{ width: stroke, height: s * 0.7, backgroundColor: color }} />
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              width: s * 0.45,
              height: s * 0.45,
              borderBottomWidth: stroke,
              borderRightWidth: stroke,
              borderColor: color,
              transform: [{ rotate: '45deg' }],
            }}
          />
        </View>
      </View>
    );
  }

  // Identity / Aadhaar Card
  if (name === 'id-card' || name === 'aadhaar-card' || name === 'badge') {
    const cardW = Math.round(scaledSize * 0.88);
    const cardH = Math.round(scaledSize * 0.62);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View
          style={{
            width: cardW,
            height: cardH,
            borderWidth: stroke,
            borderRadius: ms(3),
            borderColor: color,
            padding: ms(2),
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Avatar on left */}
          <View
            style={{
              width: Math.round(cardH * 0.65),
              height: Math.round(cardH * 0.65),
              borderRadius: ms(2),
              borderWidth: stroke * 0.9,
              borderColor: color,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View style={{ width: ms(4), height: ms(4), borderRadius: ms(2), backgroundColor: color, marginBottom: 1 }} />
            <View style={{ width: ms(7), height: ms(3), borderTopLeftRadius: ms(3), borderTopRightRadius: ms(3), backgroundColor: color }} />
          </View>
          {/* Text lines on right */}
          <View style={{ flex: 1, paddingLeft: ms(4), justifyContent: 'space-around', height: '80%' }}>
            <View style={{ width: '85%', height: stroke * 0.9, backgroundColor: color }} />
            <View style={{ width: '65%', height: stroke * 0.9, backgroundColor: color }} />
            <View style={{ width: '95%', height: stroke * 0.9, backgroundColor: color }} />
          </View>
        </View>
      </View>
    );
  }

  // PAN Card (Tax card with chip & number)
  if (name === 'pan-card') {
    const cardW = Math.round(scaledSize * 0.88);
    const cardH = Math.round(scaledSize * 0.62);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View
          style={{
            width: cardW,
            height: cardH,
            borderWidth: stroke,
            borderRadius: ms(3),
            borderColor: color,
            padding: ms(3),
            justifyContent: 'space-between',
          }}
        >
          {/* Header strip */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ width: '40%', height: stroke * 1.1, backgroundColor: color }} />
            <View style={{ width: ms(6), height: ms(5), borderWidth: stroke * 0.8, borderColor: color, borderRadius: 1 }} />
          </View>
          {/* Number stripe */}
          <View style={{ width: '80%', height: stroke * 1.2, backgroundColor: color }} />
          {/* Bottom signature line */}
          <View style={{ width: '50%', height: stroke * 0.9, backgroundColor: color }} />
        </View>
      </View>
    );
  }

  // Bank Passbook (Booklet / Ledger)
  if (name === 'bank-passbook' || name === 'passbook') {
    const bW = Math.round(scaledSize * 0.84);
    const bH = Math.round(scaledSize * 0.68);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View
          style={{
            width: bW,
            height: bH,
            borderWidth: stroke,
            borderRadius: ms(3),
            borderColor: color,
            padding: ms(3),
            justifyContent: 'space-between',
          }}
        >
          {/* Top header fold / bank title */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ width: '50%', height: stroke * 1.2, backgroundColor: color }} />
            {/* Small bank pillar icon */}
            <View style={{ flexDirection: 'row', gap: 1 }}>
              <View style={{ width: 1.5, height: ms(4), backgroundColor: color }} />
              <View style={{ width: 1.5, height: ms(4), backgroundColor: color }} />
              <View style={{ width: 1.5, height: ms(4), backgroundColor: color }} />
            </View>
          </View>
          {/* Account line */}
          <View style={{ width: '85%', height: stroke * 0.9, backgroundColor: color }} />
          {/* Ledger transaction rows */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ width: '35%', height: stroke * 0.8, backgroundColor: color }} />
            <View style={{ width: '40%', height: stroke * 0.8, backgroundColor: color }} />
          </View>
        </View>
      </View>
    );
  }

  // Passport Size Photo
  if (name === 'passport-photo' || name === 'photo-frame') {
    const fSize = Math.round(scaledSize * 0.76);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View
          style={{
            width: fSize,
            height: fSize,
            borderWidth: stroke,
            borderRadius: ms(3),
            borderColor: color,
            alignItems: 'center',
            justifyContent: 'center',
            paddingBottom: ms(2),
          }}
        >
          {/* Head */}
          <View
            style={{
              width: ms(8),
              height: ms(8),
              borderRadius: ms(4),
              borderWidth: stroke * 0.9,
              borderColor: color,
              marginBottom: 1,
            }}
          />
          {/* Shoulders */}
          <View
            style={{
              width: ms(13),
              height: ms(6),
              borderTopLeftRadius: ms(6),
              borderTopRightRadius: ms(6),
              borderWidth: stroke * 0.9,
              borderBottomWidth: 0,
              borderColor: color,
            }}
          />
        </View>
      </View>
    );
  }

  // Police Clearance Badge / Shield
  if (name === 'police-shield' || name === 'police') {
    const sW = Math.round(scaledSize * 0.8);
    const sH = Math.round(scaledSize * 0.88);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View
          style={{
            width: sW,
            height: sH,
            borderWidth: stroke,
            borderColor: color,
            borderTopLeftRadius: sW * 0.5,
            borderTopRightRadius: sW * 0.5,
            borderBottomLeftRadius: sW * 0.55,
            borderBottomRightRadius: sW * 0.55,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Central Star Badge */}
          <View
            style={{
              width: ms(7),
              height: ms(7),
              borderWidth: stroke * 0.8,
              borderColor: color,
              transform: [{ rotate: '45deg' }],
            }}
          />
        </View>
      </View>
    );
  }

  // Joining Form / Contract
  if (name === 'joining-form' || name === 'agreement') {
    const dW = Math.round(scaledSize * 0.68);
    const dH = Math.round(scaledSize * 0.84);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View
          style={{
            width: dW,
            height: dH,
            borderWidth: stroke,
            borderRadius: ms(3),
            borderColor: color,
            padding: ms(3),
            justifyContent: 'space-between',
          }}
        >
          <View style={{ width: '80%', height: stroke, backgroundColor: color }} />
          <View style={{ width: '60%', height: stroke, backgroundColor: color }} />
          <View style={{ width: '90%', height: stroke, backgroundColor: color }} />
          {/* Signature mark at bottom */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
            <View style={{ width: ms(8), height: stroke, backgroundColor: color }} />
            <View style={{ width: ms(4), height: ms(4), borderRadius: ms(2), borderWidth: stroke * 0.8, borderColor: color }} />
          </View>
        </View>
      </View>
    );
  }


  // 7b2. Camera Icon
  if (name === 'camera') {
    const cW = Math.round(scaledSize * 0.82);
    const cH = Math.round(scaledSize * 0.62);
    const lensR = Math.round(scaledSize * 0.2);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View
          style={{
            width: cW,
            height: cH,
            borderWidth: stroke,
            borderRadius: ms(4),
            borderColor: color,
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: ms(2),
          }}
        >
          <View
            style={{
              width: lensR * 2,
              height: lensR * 2,
              borderRadius: lensR,
              borderWidth: stroke,
              borderColor: color,
            }}
          />
        </View>
        {/* Flash notch */}
        <View
          style={{
            position: 'absolute',
            top: ms(1),
            left: ms(5),
            width: ms(5),
            height: stroke * 1.5,
            borderTopLeftRadius: ms(2),
            borderTopRightRadius: ms(2),
            backgroundColor: color,
          }}
        />
      </View>
    );
  }

  // 7c. Building / Companies / Dual Tower Outline
  if (name === 'building' || name === 'briefcase' || name === 'bank') {
    const bW = Math.round(scaledSize * 0.78);
    const bH = Math.round(scaledSize * 0.82);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View style={{ width: bW, height: bH, position: 'relative', justifyContent: 'flex-end' }}>
          {/* Main tall tower */}
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: bW * 0.58,
              height: bH,
              borderWidth: stroke,
              borderColor: color,
              borderTopLeftRadius: ms(3),
              borderTopRightRadius: ms(3),
              justifyContent: 'space-around',
              paddingVertical: ms(3),
              alignItems: 'center',
            }}
          >
            <View style={{ flexDirection: 'row', gap: ms(2) }}>
              <View style={{ width: ms(3), height: ms(3), backgroundColor: color }} />
              <View style={{ width: ms(3), height: ms(3), backgroundColor: color }} />
            </View>
            <View style={{ flexDirection: 'row', gap: ms(2) }}>
              <View style={{ width: ms(3), height: ms(3), backgroundColor: color }} />
              <View style={{ width: ms(3), height: ms(3), backgroundColor: color }} />
            </View>
          </View>
          {/* Right smaller wing */}
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: bW * 0.44,
              height: bH * 0.65,
              borderTopWidth: stroke,
              borderRightWidth: stroke,
              borderBottomWidth: stroke,
              borderColor: color,
              borderTopRightRadius: ms(3),
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <View style={{ width: ms(4), height: ms(4), backgroundColor: color }} />
          </View>
        </View>
      </View>
    );
  }

  // 8. People / Users / Cleaning / Car
  if (name === 'people' || name === 'users' || name === 'user-plus') {
    const h = Math.round(scaledSize * 0.3);
    const w = Math.round(scaledSize * 0.55);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize, flexDirection: 'row' }, style as ViewStyle]}>
        <View style={{ alignItems: 'center' }}>
          <View style={{ width: h, height: h, borderRadius: h / 2, borderWidth: stroke, borderColor: color }} />
          <View style={{ width: w, height: h * 0.8, borderTopLeftRadius: w / 2, borderTopRightRadius: w / 2, borderWidth: stroke, borderBottomWidth: 0, borderColor: color }} />
        </View>
      </View>
    );
  }

  // 8b. Flask / Chemical / Lab Bottle Icon
  if (name === 'flask' || name === 'chemical' || name === 'chemicals' || name === 'bottle') {
    const fw = Math.round(scaledSize * 0.72);
    const fh = Math.round(scaledSize * 0.84);
    const neckW = Math.round(scaledSize * 0.22);
    const neckH = Math.round(scaledSize * 0.28);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View style={{ width: fw, height: fh, alignItems: 'center', justifyContent: 'flex-end', position: 'relative' }}>
          {/* Flask Rim */}
          <View
            style={{
              position: 'absolute',
              top: 0,
              width: neckW + stroke * 2,
              height: stroke * 1.4,
              borderRadius: stroke * 0.7,
              backgroundColor: color,
            }}
          />
          {/* Flask Neck */}
          <View
            style={{
              position: 'absolute',
              top: stroke * 1.2,
              width: neckW,
              height: neckH,
              borderLeftWidth: stroke,
              borderRightWidth: stroke,
              borderColor: color,
            }}
          />
          {/* Flask Triangular Body */}
          <View
            style={{
              width: fw,
              height: fh - neckH,
              borderWidth: stroke,
              borderBottomLeftRadius: ms(6),
              borderBottomRightRadius: ms(6),
              borderColor: color,
              alignItems: 'center',
              justifyContent: 'flex-end',
              paddingBottom: ms(3),
            }}
          >
            {/* Liquid Level Line */}
            <View
              style={{
                width: fw * 0.7,
                height: stroke * 1.1,
                backgroundColor: color,
                opacity: 0.85,
                borderRadius: 1,
              }}
            />
            {/* Bubble Dots inside liquid */}
            <View style={{ flexDirection: 'row', gap: ms(3), marginTop: ms(2) }}>
              <View style={{ width: ms(3), height: ms(3), borderRadius: ms(1.5), backgroundColor: color }} />
              <View style={{ width: ms(2), height: ms(2), borderRadius: ms(1), backgroundColor: color }} />
            </View>
          </View>
        </View>
      </View>
    );
  }

  if (name === 'cleaning') {
    const sz = Math.round(scaledSize * 0.7);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View style={{ width: sz, height: sz, borderWidth: stroke, borderRadius: ms(4), borderColor: color, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: sz * 0.5, height: sz * 0.25, borderLeftWidth: stroke, borderBottomWidth: stroke, borderColor: color, transform: [{ rotate: '-45deg' }] }} />
        </View>
      </View>
    );
  }

  if (name === 'car' || name === 'truck') {
    const cw = Math.round(scaledSize * 0.8);
    const ch = Math.round(scaledSize * 0.45);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View style={{ width: cw, height: ch, borderWidth: stroke, borderRadius: ms(3), borderColor: color, position: 'relative' }}>
          <View style={{ position: 'absolute', bottom: -ms(4), left: ms(2), width: ms(6), height: ms(6), borderRadius: ms(3), borderWidth: stroke, borderColor: color, backgroundColor: '#FAF8F2' }} />
          <View style={{ position: 'absolute', bottom: -ms(4), right: ms(2), width: ms(6), height: ms(6), borderRadius: ms(3), borderWidth: stroke, borderColor: color, backgroundColor: '#FAF8F2' }} />
        </View>
      </View>
    );
  }

  // 9. Navigation Chevrons & Arrows (Matching Screenshot)
  const chevronSize = Math.round(scaledSize * 0.42);

  if (
    name === 'chevronRight' ||
    name === 'chevron-right' ||
    name === 'chevron-forward' ||
    name === 'chevronForward'
  ) {
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View
          style={{
            width: chevronSize,
            height: chevronSize,
            borderTopWidth: stroke,
            borderRightWidth: stroke,
            borderColor: color,
            transform: [{ rotate: '45deg' }, { translateX: -scaledSize * 0.08 }],
          }}
        />
      </View>
    );
  }

  if (name === 'chevronDown' || name === 'chevron-down') {
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View
          style={{
            width: chevronSize,
            height: chevronSize,
            borderBottomWidth: stroke,
            borderRightWidth: stroke,
            borderColor: color,
            transform: [{ rotate: '45deg' }, { translateY: -scaledSize * 0.08 }],
          }}
        />
      </View>
    );
  }

  if (name === 'chevronUp' || name === 'chevron-up') {
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View
          style={{
            width: chevronSize,
            height: chevronSize,
            borderTopWidth: stroke,
            borderLeftWidth: stroke,
            borderColor: color,
            transform: [{ rotate: '45deg' }, { translateY: scaledSize * 0.08 }],
          }}
        />
      </View>
    );
  }

  if (name === 'chevronLeft' || name === 'chevron-left' || name === 'arrowLeft' || name === 'arrow-left') {
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View
          style={{
            width: chevronSize,
            height: chevronSize,
            borderLeftWidth: stroke,
            borderBottomWidth: stroke,
            borderColor: color,
            transform: [{ rotate: '45deg' }, { translateX: scaledSize * 0.08 }],
          }}
        />
      </View>
    );
  }

  if (name === 'arrow-up-right' || name === 'arrowUpRight') {
    const arrSize = Math.round(scaledSize * 0.52);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View style={{ width: arrSize, height: arrSize, position: 'relative' }}>
          <View style={{ position: 'absolute', top: 0, right: 0, width: arrSize * 0.7, height: arrSize * 0.7, borderTopWidth: stroke, borderRightWidth: stroke, borderColor: color }} />
          <View style={{ position: 'absolute', bottom: arrSize * 0.1, left: arrSize * 0.1, width: stroke, height: arrSize * 1.15, backgroundColor: color, transform: [{ rotate: '-45deg' }, { translateY: -arrSize * 0.1 }] }} />
        </View>
      </View>
    );
  }

  if (name === 'arrow-down-left' || name === 'arrowDownLeft') {
    const arrSize = Math.round(scaledSize * 0.52);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View style={{ width: arrSize, height: arrSize, position: 'relative' }}>
          <View style={{ position: 'absolute', bottom: 0, left: 0, width: arrSize * 0.7, height: arrSize * 0.7, borderBottomWidth: stroke, borderLeftWidth: stroke, borderColor: color }} />
          <View style={{ position: 'absolute', top: arrSize * 0.1, right: arrSize * 0.1, width: stroke, height: arrSize * 1.15, backgroundColor: color, transform: [{ rotate: '-45deg' }, { translateY: arrSize * 0.1 }] }} />
        </View>
      </View>
    );
  }

  if (name === 'swap' || name === 'repeat') {
    const swSize = Math.round(scaledSize * 0.6);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View style={{ width: swSize, height: swSize * 0.65, justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
            <View style={{ flex: 1, height: stroke, backgroundColor: color }} />
            <View style={{ width: swSize * 0.28, height: swSize * 0.28, borderTopWidth: stroke, borderRightWidth: stroke, borderColor: color, transform: [{ rotate: '45deg' }, { translateX: -1 }] }} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
            <View style={{ width: swSize * 0.28, height: swSize * 0.28, borderBottomWidth: stroke, borderLeftWidth: stroke, borderColor: color, transform: [{ rotate: '45deg' }, { translateX: 1 }] }} />
            <View style={{ flex: 1, height: stroke, backgroundColor: color }} />
          </View>
        </View>
      </View>
    );
  }

  if (name === 'bell' || name === 'notifications' || name === 'notification') {
    const bellW = Math.round(scaledSize * 0.68);
    const bellH = Math.round(scaledSize * 0.72);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        {/* Top Handle Loop */}
        <View
          style={{
            width: stroke * 2.2,
            height: stroke * 2,
            borderTopLeftRadius: stroke,
            borderTopRightRadius: stroke,
            borderWidth: stroke * 0.9,
            borderBottomWidth: 0,
            borderColor: color,
            marginBottom: -ms(1),
          }}
        />
        {/* Bell Body Dome */}
        <View
          style={{
            width: bellW,
            height: bellH * 0.72,
            borderWidth: stroke,
            borderTopLeftRadius: bellW * 0.48,
            borderTopRightRadius: bellW * 0.48,
            borderBottomLeftRadius: ms(3),
            borderBottomRightRadius: ms(3),
            borderColor: color,
          }}
        />
        {/* Bottom Rim Bar */}
        <View
          style={{
            width: bellW * 1.18,
            height: stroke * 1.2,
            backgroundColor: color,
            borderRadius: stroke * 0.6,
            marginTop: -stroke * 0.4,
          }}
        />
        {/* Clapper / Hammer */}
        <View
          style={{
            width: bellW * 0.28,
            height: bellW * 0.2,
            borderBottomLeftRadius: bellW * 0.14,
            borderBottomRightRadius: bellW * 0.14,
            backgroundColor: color,
            marginTop: stroke * 0.3,
          }}
        />
      </View>
    );
  }

  // 10. Logout / Log-Out (Pure vector geometry)
  if (name === 'logout' || name === 'log-out') {
    const boxW = Math.round(scaledSize * 0.78);
    const boxH = Math.round(scaledSize * 0.85);
    const arrowW = Math.round(scaledSize * 0.48);
    const arrowHead = Math.round(scaledSize * 0.28);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View style={{ width: boxW, height: boxH, position: 'relative', justifyContent: 'center' }}>
          {/* Door / bracket frame */}
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: boxW * 0.62,
              height: boxH,
              borderTopWidth: stroke,
              borderLeftWidth: stroke,
              borderBottomWidth: stroke,
              borderColor: color,
              borderTopLeftRadius: ms(4),
              borderBottomLeftRadius: ms(4),
            }}
          />
          {/* Exit arrow pointing right */}
          <View
            style={{
              position: 'absolute',
              right: 0,
              flexDirection: 'row',
              alignItems: 'center',
              width: arrowW,
            }}
          >
            <View style={{ flex: 1, height: stroke, backgroundColor: color }} />
            <View
              style={{
                width: arrowHead,
                height: arrowHead,
                borderTopWidth: stroke,
                borderRightWidth: stroke,
                borderColor: color,
                transform: [{ rotate: '45deg' }, { translateX: -1 }],
              }}
            />
          </View>
        </View>
      </View>
    );
  }

  // 11. Home / Unit / Branch Icon (Pure vector geometry)
  if (name === 'home' || name === 'unit' || name === 'branch') {
    const hW = Math.round(scaledSize * 0.76);
    const hH = Math.round(scaledSize * 0.74);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View style={{ width: hW, height: hH, alignItems: 'center' }}>
          <View
            style={{
              width: hW * 0.7,
              height: hW * 0.7,
              borderTopWidth: stroke,
              borderLeftWidth: stroke,
              borderColor: color,
              transform: [{ rotate: '45deg' }, { translateY: ms(3) }],
            }}
          />
          <View
            style={{
              width: hW * 0.76,
              height: hH * 0.52,
              borderLeftWidth: stroke,
              borderRightWidth: stroke,
              borderBottomWidth: stroke,
              borderColor: color,
              marginTop: -ms(2),
            }}
          />
        </View>
      </View>
    );
  }

  // Identity / Aadhaar Card
  if (name === 'id-card' || name === 'aadhaar-card' || name === 'badge') {
    const cardW = Math.round(scaledSize * 0.88);
    const cardH = Math.round(scaledSize * 0.62);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View
          style={{
            width: cardW,
            height: cardH,
            borderWidth: stroke,
            borderRadius: ms(3),
            borderColor: color,
            padding: ms(2),
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Avatar on left */}
          <View
            style={{
              width: Math.round(cardH * 0.65),
              height: Math.round(cardH * 0.65),
              borderRadius: ms(2),
              borderWidth: stroke * 0.9,
              borderColor: color,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View style={{ width: ms(4), height: ms(4), borderRadius: ms(2), backgroundColor: color, marginBottom: 1 }} />
            <View style={{ width: ms(7), height: ms(3), borderTopLeftRadius: ms(3), borderTopRightRadius: ms(3), backgroundColor: color }} />
          </View>
          {/* Text lines on right */}
          <View style={{ flex: 1, paddingLeft: ms(4), justifyContent: 'space-around', height: '80%' }}>
            <View style={{ width: '85%', height: stroke * 0.9, backgroundColor: color }} />
            <View style={{ width: '65%', height: stroke * 0.9, backgroundColor: color }} />
            <View style={{ width: '95%', height: stroke * 0.9, backgroundColor: color }} />
          </View>
        </View>
      </View>
    );
  }

  // PAN Card (Tax card with chip & number)
  if (name === 'pan-card') {
    const cardW = Math.round(scaledSize * 0.88);
    const cardH = Math.round(scaledSize * 0.62);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View
          style={{
            width: cardW,
            height: cardH,
            borderWidth: stroke,
            borderRadius: ms(3),
            borderColor: color,
            padding: ms(3),
            justifyContent: 'space-between',
          }}
        >
          {/* Header strip */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ width: '40%', height: stroke * 1.1, backgroundColor: color }} />
            <View style={{ width: ms(6), height: ms(5), borderWidth: stroke * 0.8, borderColor: color, borderRadius: 1 }} />
          </View>
          {/* Number stripe */}
          <View style={{ width: '80%', height: stroke * 1.2, backgroundColor: color }} />
          {/* Bottom signature line */}
          <View style={{ width: '50%', height: stroke * 0.9, backgroundColor: color }} />
        </View>
      </View>
    );
  }

  // Bank Passbook (Booklet / Ledger)
  if (name === 'bank-passbook' || name === 'passbook') {
    const bW = Math.round(scaledSize * 0.84);
    const bH = Math.round(scaledSize * 0.68);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View
          style={{
            width: bW,
            height: bH,
            borderWidth: stroke,
            borderRadius: ms(3),
            borderColor: color,
            padding: ms(3),
            justifyContent: 'space-between',
          }}
        >
          {/* Top header fold / bank title */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ width: '50%', height: stroke * 1.2, backgroundColor: color }} />
            {/* Small bank pillar icon */}
            <View style={{ flexDirection: 'row', gap: 1 }}>
              <View style={{ width: 1.5, height: ms(4), backgroundColor: color }} />
              <View style={{ width: 1.5, height: ms(4), backgroundColor: color }} />
              <View style={{ width: 1.5, height: ms(4), backgroundColor: color }} />
            </View>
          </View>
          {/* Account line */}
          <View style={{ width: '85%', height: stroke * 0.9, backgroundColor: color }} />
          {/* Ledger transaction rows */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ width: '35%', height: stroke * 0.8, backgroundColor: color }} />
            <View style={{ width: '40%', height: stroke * 0.8, backgroundColor: color }} />
          </View>
        </View>
      </View>
    );
  }

  // Passport Size Photo
  if (name === 'passport-photo' || name === 'photo-frame') {
    const fSize = Math.round(scaledSize * 0.76);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View
          style={{
            width: fSize,
            height: fSize,
            borderWidth: stroke,
            borderRadius: ms(3),
            borderColor: color,
            alignItems: 'center',
            justifyContent: 'center',
            paddingBottom: ms(2),
          }}
        >
          {/* Head */}
          <View
            style={{
              width: ms(8),
              height: ms(8),
              borderRadius: ms(4),
              borderWidth: stroke * 0.9,
              borderColor: color,
              marginBottom: 1,
            }}
          />
          {/* Shoulders */}
          <View
            style={{
              width: ms(13),
              height: ms(6),
              borderTopLeftRadius: ms(6),
              borderTopRightRadius: ms(6),
              borderWidth: stroke * 0.9,
              borderBottomWidth: 0,
              borderColor: color,
            }}
          />
        </View>
      </View>
    );
  }

  // Police Clearance Badge / Shield
  if (name === 'police-shield' || name === 'police') {
    const sW = Math.round(scaledSize * 0.8);
    const sH = Math.round(scaledSize * 0.88);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View
          style={{
            width: sW,
            height: sH,
            borderWidth: stroke,
            borderColor: color,
            borderTopLeftRadius: sW * 0.5,
            borderTopRightRadius: sW * 0.5,
            borderBottomLeftRadius: sW * 0.55,
            borderBottomRightRadius: sW * 0.55,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Central Star Badge */}
          <View
            style={{
              width: ms(7),
              height: ms(7),
              borderWidth: stroke * 0.8,
              borderColor: color,
              transform: [{ rotate: '45deg' }],
            }}
          />
        </View>
      </View>
    );
  }

  // Joining Form / Contract
  if (name === 'joining-form' || name === 'agreement') {
    const dW = Math.round(scaledSize * 0.68);
    const dH = Math.round(scaledSize * 0.84);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View
          style={{
            width: dW,
            height: dH,
            borderWidth: stroke,
            borderRadius: ms(3),
            borderColor: color,
            padding: ms(3),
            justifyContent: 'space-between',
          }}
        >
          <View style={{ width: '80%', height: stroke, backgroundColor: color }} />
          <View style={{ width: '60%', height: stroke, backgroundColor: color }} />
          <View style={{ width: '90%', height: stroke, backgroundColor: color }} />
          {/* Signature mark at bottom */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
            <View style={{ width: ms(8), height: stroke, backgroundColor: color }} />
            <View style={{ width: ms(4), height: ms(4), borderRadius: ms(2), borderWidth: stroke * 0.8, borderColor: color }} />
          </View>
        </View>
      </View>
    );
  }


  // 12. Search Icon (Circle + diagonal handle)
  if (name === 'search') {
    const sLens = Math.round(scaledSize * 0.52);
    const handleL = Math.round(scaledSize * 0.32);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View style={{ width: scaledSize * 0.8, height: scaledSize * 0.8, position: 'relative' }}>
          <View
            style={{
              width: sLens,
              height: sLens,
              borderRadius: sLens / 2,
              borderWidth: stroke,
              borderColor: color,
            }}
          />
          <View
            style={{
              position: 'absolute',
              bottom: ms(1),
              right: ms(2),
              width: stroke,
              height: handleL,
              backgroundColor: color,
              transform: [{ rotate: '-45deg' }],
            }}
          />
        </View>
      </View>
    );
  }

  // Identity / Aadhaar Card
  if (name === 'id-card' || name === 'aadhaar-card' || name === 'badge') {
    const cardW = Math.round(scaledSize * 0.88);
    const cardH = Math.round(scaledSize * 0.62);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View
          style={{
            width: cardW,
            height: cardH,
            borderWidth: stroke,
            borderRadius: ms(3),
            borderColor: color,
            padding: ms(2),
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Avatar on left */}
          <View
            style={{
              width: Math.round(cardH * 0.65),
              height: Math.round(cardH * 0.65),
              borderRadius: ms(2),
              borderWidth: stroke * 0.9,
              borderColor: color,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View style={{ width: ms(4), height: ms(4), borderRadius: ms(2), backgroundColor: color, marginBottom: 1 }} />
            <View style={{ width: ms(7), height: ms(3), borderTopLeftRadius: ms(3), borderTopRightRadius: ms(3), backgroundColor: color }} />
          </View>
          {/* Text lines on right */}
          <View style={{ flex: 1, paddingLeft: ms(4), justifyContent: 'space-around', height: '80%' }}>
            <View style={{ width: '85%', height: stroke * 0.9, backgroundColor: color }} />
            <View style={{ width: '65%', height: stroke * 0.9, backgroundColor: color }} />
            <View style={{ width: '95%', height: stroke * 0.9, backgroundColor: color }} />
          </View>
        </View>
      </View>
    );
  }

  // PAN Card (Tax card with chip & number)
  if (name === 'pan-card') {
    const cardW = Math.round(scaledSize * 0.88);
    const cardH = Math.round(scaledSize * 0.62);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View
          style={{
            width: cardW,
            height: cardH,
            borderWidth: stroke,
            borderRadius: ms(3),
            borderColor: color,
            padding: ms(3),
            justifyContent: 'space-between',
          }}
        >
          {/* Header strip */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ width: '40%', height: stroke * 1.1, backgroundColor: color }} />
            <View style={{ width: ms(6), height: ms(5), borderWidth: stroke * 0.8, borderColor: color, borderRadius: 1 }} />
          </View>
          {/* Number stripe */}
          <View style={{ width: '80%', height: stroke * 1.2, backgroundColor: color }} />
          {/* Bottom signature line */}
          <View style={{ width: '50%', height: stroke * 0.9, backgroundColor: color }} />
        </View>
      </View>
    );
  }

  // Bank Passbook (Booklet / Ledger)
  if (name === 'bank-passbook' || name === 'passbook') {
    const bW = Math.round(scaledSize * 0.84);
    const bH = Math.round(scaledSize * 0.68);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View
          style={{
            width: bW,
            height: bH,
            borderWidth: stroke,
            borderRadius: ms(3),
            borderColor: color,
            padding: ms(3),
            justifyContent: 'space-between',
          }}
        >
          {/* Top header fold / bank title */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ width: '50%', height: stroke * 1.2, backgroundColor: color }} />
            {/* Small bank pillar icon */}
            <View style={{ flexDirection: 'row', gap: 1 }}>
              <View style={{ width: 1.5, height: ms(4), backgroundColor: color }} />
              <View style={{ width: 1.5, height: ms(4), backgroundColor: color }} />
              <View style={{ width: 1.5, height: ms(4), backgroundColor: color }} />
            </View>
          </View>
          {/* Account line */}
          <View style={{ width: '85%', height: stroke * 0.9, backgroundColor: color }} />
          {/* Ledger transaction rows */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ width: '35%', height: stroke * 0.8, backgroundColor: color }} />
            <View style={{ width: '40%', height: stroke * 0.8, backgroundColor: color }} />
          </View>
        </View>
      </View>
    );
  }

  // Passport Size Photo
  if (name === 'passport-photo' || name === 'photo-frame') {
    const fSize = Math.round(scaledSize * 0.76);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View
          style={{
            width: fSize,
            height: fSize,
            borderWidth: stroke,
            borderRadius: ms(3),
            borderColor: color,
            alignItems: 'center',
            justifyContent: 'center',
            paddingBottom: ms(2),
          }}
        >
          {/* Head */}
          <View
            style={{
              width: ms(8),
              height: ms(8),
              borderRadius: ms(4),
              borderWidth: stroke * 0.9,
              borderColor: color,
              marginBottom: 1,
            }}
          />
          {/* Shoulders */}
          <View
            style={{
              width: ms(13),
              height: ms(6),
              borderTopLeftRadius: ms(6),
              borderTopRightRadius: ms(6),
              borderWidth: stroke * 0.9,
              borderBottomWidth: 0,
              borderColor: color,
            }}
          />
        </View>
      </View>
    );
  }

  // Police Clearance Badge / Shield
  if (name === 'police-shield' || name === 'police') {
    const sW = Math.round(scaledSize * 0.8);
    const sH = Math.round(scaledSize * 0.88);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View
          style={{
            width: sW,
            height: sH,
            borderWidth: stroke,
            borderColor: color,
            borderTopLeftRadius: sW * 0.5,
            borderTopRightRadius: sW * 0.5,
            borderBottomLeftRadius: sW * 0.55,
            borderBottomRightRadius: sW * 0.55,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Central Star Badge */}
          <View
            style={{
              width: ms(7),
              height: ms(7),
              borderWidth: stroke * 0.8,
              borderColor: color,
              transform: [{ rotate: '45deg' }],
            }}
          />
        </View>
      </View>
    );
  }

  // Joining Form / Contract
  if (name === 'joining-form' || name === 'agreement') {
    const dW = Math.round(scaledSize * 0.68);
    const dH = Math.round(scaledSize * 0.84);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View
          style={{
            width: dW,
            height: dH,
            borderWidth: stroke,
            borderRadius: ms(3),
            borderColor: color,
            padding: ms(3),
            justifyContent: 'space-between',
          }}
        >
          <View style={{ width: '80%', height: stroke, backgroundColor: color }} />
          <View style={{ width: '60%', height: stroke, backgroundColor: color }} />
          <View style={{ width: '90%', height: stroke, backgroundColor: color }} />
          {/* Signature mark at bottom */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
            <View style={{ width: ms(8), height: stroke, backgroundColor: color }} />
            <View style={{ width: ms(4), height: ms(4), borderRadius: ms(2), borderWidth: stroke * 0.8, borderColor: color }} />
          </View>
        </View>
      </View>
    );
  }


  // 13. Plus Icon (+)
  if (name === 'plus') {
    const pSize = Math.round(scaledSize * 0.6);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View style={{ width: pSize, height: pSize, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ position: 'absolute', width: '100%', height: stroke, backgroundColor: color }} />
          <View style={{ position: 'absolute', height: '100%', width: stroke, backgroundColor: color }} />
        </View>
      </View>
    );
  }

  // 14. Filter / Sliders Icon
  if (name === 'filter') {
    const fW = Math.round(scaledSize * 0.7);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View style={{ width: fW, height: fW * 0.65, justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1, height: stroke, backgroundColor: color }} />
            <View style={{ width: ms(4), height: ms(4), borderRadius: ms(2), backgroundColor: color }} />
            <View style={{ flex: 2, height: stroke, backgroundColor: color }} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 2, height: stroke, backgroundColor: color }} />
            <View style={{ width: ms(4), height: ms(4), borderRadius: ms(2), backgroundColor: color }} />
            <View style={{ flex: 1, height: stroke, backgroundColor: color }} />
          </View>
        </View>
      </View>
    );
  }

  // 15. Phone Icon
  if (name === 'phone') {
    const pW = Math.round(scaledSize * 0.55);
    const pH = Math.round(scaledSize * 0.75);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View
          style={{
            width: pW,
            height: pH,
            borderWidth: stroke,
            borderRadius: ms(4),
            borderColor: color,
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: ms(2),
          }}
        >
          <View style={{ width: ms(6), height: stroke, backgroundColor: color }} />
          <View style={{ width: ms(4), height: ms(4), borderRadius: ms(2), backgroundColor: color }} />
        </View>
      </View>
    );
  }

  // 16. Refresh / Sync Icon (Pure Vector Line - No Font Linking Dependency)
  if (
    name === 'refresh' ||
    name === 'refresh-cw' ||
    name === 'refreshCw' ||
    name === 'rotate-cw' ||
    name === 'sync'
  ) {
    const rSize = Math.round(scaledSize * 0.74);
    const arrowW = Math.max(Math.round(scaledSize * 0.22), 4);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        {/* Circular arc with top-right opening */}
        <View
          style={{
            width: rSize,
            height: rSize,
            borderRadius: rSize / 2,
            borderWidth: stroke,
            borderColor: color,
            borderTopColor: 'transparent',
            transform: [{ rotate: '45deg' }],
          }}
        />
        {/* Tangent arrowhead pointing clockwise */}
        <View
          style={{
            position: 'absolute',
            top: ms(2),
            right: ms(2),
            width: 0,
            height: 0,
            borderLeftWidth: arrowW,
            borderBottomWidth: arrowW,
            borderLeftColor: 'transparent',
            borderBottomColor: color,
            transform: [{ rotate: '-20deg' }],
          }}
        />
      </View>
    );
  }

  // Maximize / Full Screen Icon
  if (name === 'maximize' || name === 'fullscreen' || name === 'expand') {
    const s = Math.round(scaledSize * 0.75);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View
          style={{
            width: s,
            height: s,
            borderWidth: stroke,
            borderColor: color,
            borderRadius: 2,
          }}
        />
      </View>
    );
  }

  // 17. Check & Close
  if (name === 'check' || name === 'check-circle' || name === 'checkmark' || name === 'tick') {
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View
          style={{
            width: scaledSize * 0.45,
            height: scaledSize * 0.25,
            borderLeftWidth: stroke,
            borderBottomWidth: stroke,
            borderColor: color,
            transform: [{ rotate: '-45deg' }, { translateY: -scaledSize * 0.06 }],
          }}
        />
      </View>
    );
  }

  if (name === 'close' || name === 'x') {
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <Text style={{ fontSize: scaledSize * 0.8, color, fontWeight: '300', textAlign: 'center', lineHeight: scaledSize }}>
          ✕
        </Text>
      </View>
    );
  }

  // Settings / Gear / Cog Icon
  if (name === 'settings' || name === 'gear' || name === 'cog') {
    const s = Math.round(scaledSize * 0.76);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        {/* Outer Ring */}
        <View
          style={{
            width: s,
            height: s,
            borderRadius: s / 2,
            borderWidth: stroke * 1.2,
            borderColor: color,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Center Hole */}
          <View
            style={{
              width: s * 0.38,
              height: s * 0.38,
              borderRadius: (s * 0.38) / 2,
              borderWidth: stroke,
              borderColor: color,
            }}
          />
        </View>
        {/* Cross Teeth (Vertical) */}
        <View
          style={{
            position: 'absolute',
            width: stroke * 1.4,
            height: s * 1.18,
            backgroundColor: color,
            borderRadius: stroke * 0.5,
            zIndex: -1,
          }}
        />
        {/* Cross Teeth (Horizontal) */}
        <View
          style={{
            position: 'absolute',
            width: s * 1.18,
            height: stroke * 1.4,
            backgroundColor: color,
            borderRadius: stroke * 0.5,
            zIndex: -1,
          }}
        />
        {/* Diagonal Teeth (45 deg) */}
        <View
          style={{
            position: 'absolute',
            width: stroke * 1.4,
            height: s * 1.18,
            backgroundColor: color,
            borderRadius: stroke * 0.5,
            transform: [{ rotate: '45deg' }],
            zIndex: -1,
          }}
        />
        {/* Diagonal Teeth (-45 deg) */}
        <View
          style={{
            position: 'absolute',
            width: stroke * 1.4,
            height: s * 1.18,
            backgroundColor: color,
            borderRadius: stroke * 0.5,
            transform: [{ rotate: '-45deg' }],
            zIndex: -1,
          }}
        />
      </View>
    );
  }

  // Mail / Email icon
  if (name === 'mail' || name === 'email') {
    const mW = Math.round(scaledSize * 0.75);
    const mH = Math.round(scaledSize * 0.55);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View
          style={{
            width: mW,
            height: mH,
            borderWidth: stroke,
            borderRadius: ms(3),
            borderColor: color,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View
            style={{
              width: Math.round(mW * 0.5),
              height: stroke,
              backgroundColor: color,
            }}
          />
        </View>
      </View>
    );
  }

  // Identity / Aadhaar Card
  if (name === 'id-card' || name === 'aadhaar-card' || name === 'badge') {
    const cardW = Math.round(scaledSize * 0.88);
    const cardH = Math.round(scaledSize * 0.62);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View
          style={{
            width: cardW,
            height: cardH,
            borderWidth: stroke,
            borderRadius: ms(3),
            borderColor: color,
            padding: ms(2),
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Avatar on left */}
          <View
            style={{
              width: Math.round(cardH * 0.65),
              height: Math.round(cardH * 0.65),
              borderRadius: ms(2),
              borderWidth: stroke * 0.9,
              borderColor: color,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View style={{ width: ms(4), height: ms(4), borderRadius: ms(2), backgroundColor: color, marginBottom: 1 }} />
            <View style={{ width: ms(7), height: ms(3), borderTopLeftRadius: ms(3), borderTopRightRadius: ms(3), backgroundColor: color }} />
          </View>
          {/* Text lines on right */}
          <View style={{ flex: 1, paddingLeft: ms(4), justifyContent: 'space-around', height: '80%' }}>
            <View style={{ width: '85%', height: stroke * 0.9, backgroundColor: color }} />
            <View style={{ width: '65%', height: stroke * 0.9, backgroundColor: color }} />
            <View style={{ width: '95%', height: stroke * 0.9, backgroundColor: color }} />
          </View>
        </View>
      </View>
    );
  }

  // PAN Card (Tax card with chip & number)
  if (name === 'pan-card') {
    const cardW = Math.round(scaledSize * 0.88);
    const cardH = Math.round(scaledSize * 0.62);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View
          style={{
            width: cardW,
            height: cardH,
            borderWidth: stroke,
            borderRadius: ms(3),
            borderColor: color,
            padding: ms(3),
            justifyContent: 'space-between',
          }}
        >
          {/* Header strip */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ width: '40%', height: stroke * 1.1, backgroundColor: color }} />
            <View style={{ width: ms(6), height: ms(5), borderWidth: stroke * 0.8, borderColor: color, borderRadius: 1 }} />
          </View>
          {/* Number stripe */}
          <View style={{ width: '80%', height: stroke * 1.2, backgroundColor: color }} />
          {/* Bottom signature line */}
          <View style={{ width: '50%', height: stroke * 0.9, backgroundColor: color }} />
        </View>
      </View>
    );
  }

  // Bank Passbook (Booklet / Ledger)
  if (name === 'bank-passbook' || name === 'passbook') {
    const bW = Math.round(scaledSize * 0.84);
    const bH = Math.round(scaledSize * 0.68);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View
          style={{
            width: bW,
            height: bH,
            borderWidth: stroke,
            borderRadius: ms(3),
            borderColor: color,
            padding: ms(3),
            justifyContent: 'space-between',
          }}
        >
          {/* Top header fold / bank title */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ width: '50%', height: stroke * 1.2, backgroundColor: color }} />
            {/* Small bank pillar icon */}
            <View style={{ flexDirection: 'row', gap: 1 }}>
              <View style={{ width: 1.5, height: ms(4), backgroundColor: color }} />
              <View style={{ width: 1.5, height: ms(4), backgroundColor: color }} />
              <View style={{ width: 1.5, height: ms(4), backgroundColor: color }} />
            </View>
          </View>
          {/* Account line */}
          <View style={{ width: '85%', height: stroke * 0.9, backgroundColor: color }} />
          {/* Ledger transaction rows */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ width: '35%', height: stroke * 0.8, backgroundColor: color }} />
            <View style={{ width: '40%', height: stroke * 0.8, backgroundColor: color }} />
          </View>
        </View>
      </View>
    );
  }

  // Passport Size Photo
  if (name === 'passport-photo' || name === 'photo-frame') {
    const fSize = Math.round(scaledSize * 0.76);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View
          style={{
            width: fSize,
            height: fSize,
            borderWidth: stroke,
            borderRadius: ms(3),
            borderColor: color,
            alignItems: 'center',
            justifyContent: 'center',
            paddingBottom: ms(2),
          }}
        >
          {/* Head */}
          <View
            style={{
              width: ms(8),
              height: ms(8),
              borderRadius: ms(4),
              borderWidth: stroke * 0.9,
              borderColor: color,
              marginBottom: 1,
            }}
          />
          {/* Shoulders */}
          <View
            style={{
              width: ms(13),
              height: ms(6),
              borderTopLeftRadius: ms(6),
              borderTopRightRadius: ms(6),
              borderWidth: stroke * 0.9,
              borderBottomWidth: 0,
              borderColor: color,
            }}
          />
        </View>
      </View>
    );
  }

  // Police Clearance Badge / Shield
  if (name === 'police-shield' || name === 'police') {
    const sW = Math.round(scaledSize * 0.8);
    const sH = Math.round(scaledSize * 0.88);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View
          style={{
            width: sW,
            height: sH,
            borderWidth: stroke,
            borderColor: color,
            borderTopLeftRadius: sW * 0.5,
            borderTopRightRadius: sW * 0.5,
            borderBottomLeftRadius: sW * 0.55,
            borderBottomRightRadius: sW * 0.55,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Central Star Badge */}
          <View
            style={{
              width: ms(7),
              height: ms(7),
              borderWidth: stroke * 0.8,
              borderColor: color,
              transform: [{ rotate: '45deg' }],
            }}
          />
        </View>
      </View>
    );
  }

  // Joining Form / Contract
  if (name === 'joining-form' || name === 'agreement') {
    const dW = Math.round(scaledSize * 0.68);
    const dH = Math.round(scaledSize * 0.84);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View
          style={{
            width: dW,
            height: dH,
            borderWidth: stroke,
            borderRadius: ms(3),
            borderColor: color,
            padding: ms(3),
            justifyContent: 'space-between',
          }}
        >
          <View style={{ width: '80%', height: stroke, backgroundColor: color }} />
          <View style={{ width: '60%', height: stroke, backgroundColor: color }} />
          <View style={{ width: '90%', height: stroke, backgroundColor: color }} />
          {/* Signature mark at bottom */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
            <View style={{ width: ms(8), height: stroke, backgroundColor: color }} />
            <View style={{ width: ms(4), height: ms(4), borderRadius: ms(2), borderWidth: stroke * 0.8, borderColor: color }} />
          </View>
        </View>
      </View>
    );
  }


  // Save / Diskette Icon
  if (name === 'save' || name === 'floppy-disk' || name === 'disk') {
    const sSize = Math.round(scaledSize * 0.82);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View
          style={{
            width: sSize,
            height: sSize,
            borderWidth: stroke,
            borderColor: color,
            borderRadius: ms(3),
            padding: ms(1.5),
            justifyContent: 'space-between',
          }}
        >
          {/* Top shutter */}
          <View
            style={{
              width: '60%',
              height: '35%',
              borderWidth: stroke * 0.9,
              borderTopWidth: 0,
              borderColor: color,
              alignSelf: 'center',
            }}
          />
          {/* Bottom label */}
          <View
            style={{
              width: '75%',
              height: '38%',
              borderWidth: stroke * 0.9,
              borderBottomWidth: 0,
              borderColor: color,
              alignSelf: 'center',
            }}
          />
        </View>
      </View>
    );
  }

  // Download Icon
  if (name === 'download') {
    const w = Math.round(scaledSize * 0.72);
    const h = Math.round(scaledSize * 0.8);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View style={{ width: w, height: h, alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center' }}>
            <View style={{ width: stroke, height: h * 0.45, backgroundColor: color }} />
            <View
              style={{
                width: ms(7),
                height: ms(7),
                borderRightWidth: stroke,
                borderBottomWidth: stroke,
                borderColor: color,
                transform: [{ rotate: '45deg' }],
                marginTop: -ms(4),
              }}
            />
          </View>
          <View
            style={{
              width: w,
              height: ms(5),
              borderLeftWidth: stroke,
              borderRightWidth: stroke,
              borderBottomWidth: stroke,
              borderColor: color,
              borderBottomLeftRadius: ms(2),
              borderBottomRightRadius: ms(2),
            }}
          />
        </View>
      </View>
    );
  }

  // Share Icon
  if (name === 'share' || name === 'share-2') {
    const nodeSize = ms(5);
    const w = Math.round(scaledSize * 0.75);
    const h = Math.round(scaledSize * 0.75);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View style={{ width: w, height: h, position: 'relative' }}>
          <View
            style={{
              position: 'absolute',
              left: 0,
              top: h / 2 - nodeSize / 2,
              width: nodeSize,
              height: nodeSize,
              borderRadius: nodeSize / 2,
              borderWidth: stroke,
              borderColor: color,
            }}
          />
          <View
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              width: nodeSize,
              height: nodeSize,
              borderRadius: nodeSize / 2,
              borderWidth: stroke,
              borderColor: color,
            }}
          />
          <View
            style={{
              position: 'absolute',
              right: 0,
              bottom: 0,
              width: nodeSize,
              height: nodeSize,
              borderRadius: nodeSize / 2,
              borderWidth: stroke,
              borderColor: color,
            }}
          />
          <View
            style={{
              position: 'absolute',
              left: nodeSize * 0.8,
              top: h * 0.25,
              width: w * 0.65,
              height: stroke,
              backgroundColor: color,
              transform: [{ rotate: '-28deg' }],
            }}
          />
          <View
            style={{
              position: 'absolute',
              left: nodeSize * 0.8,
              bottom: h * 0.25,
              width: w * 0.65,
              height: stroke,
              backgroundColor: color,
              transform: [{ rotate: '28deg' }],
            }}
          />
        </View>
      </View>
    );
  }

  // Star / Rating
  if (name === 'star' || name === 'rating') {
    const sSize = Math.round(scaledSize * 0.74);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View
          style={{
            width: sSize,
            height: sSize,
            borderWidth: stroke,
            borderColor: color,
            borderRadius: ms(3),
            transform: [{ rotate: '45deg' }],
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View
            style={{
              width: Math.round(sSize * 0.38),
              height: Math.round(sSize * 0.38),
              backgroundColor: color,
              borderRadius: ms(2),
            }}
          />
        </View>
      </View>
    );
  }

  // Fire / Flame
  if (name === 'fire' || name === 'flame') {
    const fW = Math.round(scaledSize * 0.65);
    const fH = Math.round(scaledSize * 0.8);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View
          style={{
            width: fW,
            height: fH,
            borderWidth: stroke,
            borderColor: color,
            borderTopLeftRadius: ms(4),
            borderTopRightRadius: ms(12),
            borderBottomLeftRadius: ms(10),
            borderBottomRightRadius: ms(10),
            alignItems: 'center',
            justifyContent: 'flex-end',
            paddingBottom: ms(2),
          }}
        >
          <View
            style={{
              width: Math.round(fW * 0.4),
              height: Math.round(fH * 0.35),
              borderWidth: stroke,
              borderColor: color,
              borderRadius: ms(3),
            }}
          />
        </View>
      </View>
    );
  }

  // Credit Card / Wallet / Payment
  if (name === 'credit-card' || name === 'card' || name === 'wallet') {
    const cW = Math.round(scaledSize * 0.85);
    const cH = Math.round(scaledSize * 0.6);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View
          style={{
            width: cW,
            height: cH,
            borderWidth: stroke,
            borderColor: color,
            borderRadius: ms(3),
            justifyContent: 'space-between',
            paddingVertical: ms(2),
          }}
        >
          <View style={{ width: '100%', height: ms(3), backgroundColor: color }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: ms(2), gap: ms(3) }}>
            <View style={{ width: ms(4), height: ms(3), backgroundColor: color, borderRadius: 1 }} />
            <View style={{ width: ms(8), height: stroke, backgroundColor: color }} />
          </View>
        </View>
      </View>
    );
  }

  // Cash / Money / Banknote
  if (name === 'cash' || name === 'money' || name === 'banknote') {
    const bW = Math.round(scaledSize * 0.85);
    const bH = Math.round(scaledSize * 0.55);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View
          style={{
            width: bW,
            height: bH,
            borderWidth: stroke,
            borderColor: color,
            borderRadius: ms(2),
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View
            style={{
              width: ms(6),
              height: ms(6),
              borderRadius: ms(3),
              borderWidth: stroke,
              borderColor: color,
            }}
          />
        </View>
      </View>
    );
  }

  // Medical / Hospital / Ambulance / First Aid Cross
  if (name === 'medical' || name === 'hospital' || name === 'ambulance' || name === 'first-aid') {
    const boxS = Math.round(scaledSize * 0.85);
    const armW = Math.round(scaledSize * 0.26);
    const armH = Math.round(scaledSize * 0.72);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View
          style={{
            width: boxS,
            height: boxS,
            borderRadius: ms(4),
            borderWidth: stroke,
            borderColor: color,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Vertical Arm */}
          <View
            style={{
              position: 'absolute',
              width: armW,
              height: armH,
              backgroundColor: color,
              borderRadius: 1,
            }}
          />
          {/* Horizontal Arm */}
          <View
            style={{
              position: 'absolute',
              width: armH,
              height: armW,
              backgroundColor: color,
              borderRadius: 1,
            }}
          />
        </View>
      </View>
    );
  }

  // Alert / Warning / Alert-Triangle
  if (name === 'alert' || name === 'warning' || name === 'alert-triangle') {
    const triW = Math.round(scaledSize * 0.85);
    const triH = Math.round(scaledSize * 0.78);
    return (
      <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
        <View
          style={{
            width: triW,
            height: triH,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: stroke,
            borderColor: color,
            borderRadius: ms(3),
          }}
        >
          {/* Exclamation Bar */}
          <View
            style={{
              width: stroke * 1.2,
              height: ms(7),
              backgroundColor: color,
              borderRadius: 1,
              marginBottom: ms(2),
            }}
          />
          {/* Exclamation Dot */}
          <View
            style={{
              width: stroke * 1.4,
              height: stroke * 1.4,
              borderRadius: stroke * 0.7,
              backgroundColor: color,
            }}
          />
        </View>
      </View>
    );
  }

  // Safe Default Vector Fallback (avoids missing-font '?' question mark box on Android)
  return (
    <View style={[styles.centeredBox, { width: scaledSize, height: scaledSize }, style as ViewStyle]}>
      <View
        style={{
          width: scaledSize * 0.45,
          height: scaledSize * 0.45,
          borderRadius: (scaledSize * 0.45) / 2,
          borderWidth: stroke,
          borderColor: color,
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  centeredBox: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
