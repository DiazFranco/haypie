import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import {
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  KeyboardAwareScrollView,
  type KeyboardAwareScrollViewRef,
} from 'react-native-keyboard-controller';
import { colors } from '@/theme';

type Props = {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'number-pad';
  secureTextEntry?: boolean;
  autoFocus?: boolean;
};

type InputProps = Props & { onFocus?: () => void };

type Measurable = {
  measureInWindow: (
    callback: (x: number, y: number, width: number, height: number) => void
  ) => void;
};

const ScrollContext = createContext<((input: Measurable) => void) | null>(null);

const KEYBOARD_GAP = 32;

export function FormScrollView({
  children,
  contentContainerStyle,
}: {
  children: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
}) {
  const scrollRef = useRef<KeyboardAwareScrollViewRef>(null);
  const containerRef = useRef<View>(null);
  const keyboardHeight = useRef(0);
  const scrollY = useRef(0);
  const focusedInput = useRef<Measurable | null>(null);

  const reveal = useCallback((input: Measurable) => {
    focusedInput.current = input;
    requestAnimationFrame(() => {
      containerRef.current?.measureInWindow((_cx, cy, _cw, ch) => {
        input.measureInWindow((_ix, iy, _iw, ih) => {
          const visibleBottom = cy + ch - keyboardHeight.current;
          const overflow = iy + ih + KEYBOARD_GAP - visibleBottom;
          if (overflow > 0) {
            scrollRef.current?.scrollTo({ y: scrollY.current + overflow, animated: true });
          }
        });
      });
    });
  }, []);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (e) => {
      keyboardHeight.current = e.endCoordinates?.height ?? 0;
      if (focusedInput.current) reveal(focusedInput.current);
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => {
      keyboardHeight.current = 0;
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, [reveal]);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.current = e.nativeEvent.contentOffset.y;
  };

  return (
    <ScrollContext.Provider value={reveal}>
      <View style={styles.fill} ref={containerRef}>
        <KeyboardAwareScrollView
          ref={scrollRef}
          style={styles.fill}
          contentContainerStyle={contentContainerStyle}
          bottomOffset={KEYBOARD_GAP}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {children}
        </KeyboardAwareScrollView>
      </View>
    </ScrollContext.Provider>
  );
}

export function BackButton() {
  return (
    <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.back, pressed && styles.buttonPressed]}>
      <Ionicons name="arrow-back" size={26} color={colors.text} />
    </Pressable>
  );
}

export function Input({ label, onFocus, ...rest }: InputProps) {
  const reveal = useContext(ScrollContext);
  const inputRef = useRef<TextInput>(null);

  const handleFocus = () => {
    onFocus?.();
    if (reveal && inputRef.current) reveal(inputRef.current);
  };

  return (
    <View style={styles.field}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        ref={inputRef}
        style={styles.input}
        placeholderTextColor={colors.textMuted}
        onFocus={handleFocus}
        {...rest}
      />
    </View>
  );
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost';
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' ? styles.buttonPrimary : styles.buttonGhost,
        pressed && styles.buttonPressed,
        disabled && styles.buttonDisabled,
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          variant === 'primary' ? styles.buttonTextPrimary : styles.buttonTextGhost,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  back: {
    alignSelf: 'flex-start',
    padding: 8,
    marginBottom: 8,
    marginLeft: -8,
  },
  field: { gap: 6, marginBottom: 16 },
  label: { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    color: colors.text,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  button: {
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 15,
  },
  buttonPrimary: { backgroundColor: colors.primary },
  buttonGhost: { borderColor: colors.border, borderWidth: 1 },
  buttonPressed: { opacity: 0.8 },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { fontSize: 16, fontWeight: '700' },
  buttonTextPrimary: { color: colors.primaryText },
  buttonTextGhost: { color: colors.text },
});
