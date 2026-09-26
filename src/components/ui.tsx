import { StyleSheet, Text, TextInput, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors } from '@/theme';

type Props = {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'number-pad';
  secureTextEntry?: boolean;
};

export function BackButton() {
  return (
    <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.back, pressed && styles.buttonPressed]}>
      <Ionicons name="arrow-back" size={26} color={colors.text} />
    </Pressable>
  );
}

export function Input({ label, ...rest }: Props) {
  return (
    <View style={styles.field}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        style={styles.input}
        placeholderTextColor={colors.textMuted}
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