import React from "react";
import { View, Text, ActivityIndicator, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { shortenAddress } from "../../util/format-utils";
import { styles, namedColors } from "../../styles/styles";
import { SectionContainer } from "../common/SectionContainer";
import { PinRotationProgress } from "../../util/pin-rotation";

interface PinRotationProgressDisplayProps {
  progress: PinRotationProgress;
  onDismiss: () => void;
}

/**
 * Component that displays the progress of PIN rotation and data re-encryption
 */
export const PinRotationProgressDisplay: React.FC<
  PinRotationProgressDisplayProps
> = ({ progress, onDismiss }) => {
  const isComplete =
    progress.total === 0 ||
    progress.completed + progress.failed.length >= progress.total;

  return (
    <View style={{ position: "relative" }}>
      {/* Dismiss button - only shown when complete */}
      {isComplete && (
        <TouchableOpacity
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            zIndex: 1,
            padding: 8,
          }}
          onPress={onDismiss}
          accessibilityLabel="Dismiss progress"
          accessibilityHint="Close the PIN rotation progress display"
        >
          <Ionicons
            name="close"
            size={20}
            color={namedColors.lightMediumGray}
          />
        </TouchableOpacity>
      )}

      <SectionContainer
        title={
          isComplete ? "PIN Rotation Complete" : "PIN Rotation in Progress"
        }
      >
        <InlineProgressContent progress={progress} />
      </SectionContainer>
    </View>
  );
};

/**
 * Internal component for the progress content
 */
const InlineProgressContent: React.FC<{
  progress: PinRotationProgress;
}> = ({ progress }) => {
  const progressPercentage =
    progress.total > 0
      ? Math.round((progress.completed / progress.total) * 100)
      : 100;

  const isComplete =
    progress.total === 0 ||
    progress.completed + progress.failed.length >= progress.total;

  return (
    <View style={{ paddingVertical: 16, paddingHorizontal: 4 }}>
      <Text
        style={[styles.description, { marginBottom: 16, textAlign: "center" }]}
      >
        {isComplete
          ? "Your PIN has been updated and data re-encrypted."
          : "Please wait while we re-encrypt your account data with the new PIN."}
      </Text>

      {!isComplete && (
        <View style={{ alignItems: "center", marginVertical: 12 }}>
          <ActivityIndicator size="small" color={namedColors.blue} />
        </View>
      )}

      {/* Progress bar */}
      <View
        style={{
          height: 8,
          backgroundColor: namedColors.mediumGray,
          borderRadius: 4,
          marginBottom: 12,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            height: "100%",
            backgroundColor:
              progress.failed.length > 0 ? namedColors.red : namedColors.blue,
            borderRadius: 4,
            width: `${progressPercentage}%`,
            minWidth: progressPercentage > 0 ? 4 : 0,
          }}
        />
      </View>

      {/* Progress text */}
      <Text style={[styles.description, { textAlign: "center", fontSize: 14 }]}>
        {progress.completed + progress.failed.length} of {progress.total}{" "}
        account{progress.total !== 1 ? "s" : ""} processed ({progressPercentage}
        %)
      </Text>

      {/* Current account being processed */}
      {progress.current && !isComplete && (
        <Text
          style={[
            styles.description,
            {
              textAlign: "center",
              marginTop: 8,
              fontStyle: "italic",
              fontSize: 12,
            },
          ]}
        >
          Processing account: {shortenAddress(progress.current)}
        </Text>
      )}

      {/* Summary when complete */}
      {isComplete && <CompletionSummary progress={progress} />}

      {/* Warning about failed accounts */}
      {isComplete && progress.failed.length > 0 && <FailureWarning />}
    </View>
  );
};

/**
 * Component for displaying completion summary
 */
const CompletionSummary: React.FC<{
  progress: PinRotationProgress;
}> = ({ progress }) => (
  <View style={{ marginTop: 16, paddingHorizontal: 8 }}>
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
      }}
    >
      <Ionicons
        name="checkmark-circle"
        size={20}
        color={namedColors.green}
        style={{ marginRight: 8, verticalAlign: "middle" }}
      />
      <Text
        style={[
          { color: namedColors.green, verticalAlign: "middle" },
        ]}
      >
        Successfully re-encrypted: {progress.completed} account
        {progress.completed !== 1 ? "s" : ""}
      </Text>
    </View>

    {progress.failed.length > 0 && (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginTop: 8,
        }}
      >
        <Ionicons
          name="warning"
          size={20}
          color={namedColors.red}
          style={{ marginRight: 8, marginTop: -1 }}
        />
        <Text
          style={[
            styles.description,
            {
              color: namedColors.red,
            },
          ]}
        >
          Failed to re-encrypt: {progress.failed.length} account
          {progress.failed.length !== 1 ? "s" : ""}
        </Text>
      </View>
    )}
  </View>
);

/**
 * Component for displaying failure warning
 */
const FailureWarning: React.FC = () => (
  <View
    style={{
      backgroundColor: namedColors.redOverlay,
      padding: 12,
      borderRadius: 8,
      marginTop: 16,
      borderLeftWidth: 4,
      borderLeftColor: namedColors.red,
    }}
  >
    <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
      <Ionicons
        name="alert-circle"
        size={16}
        color={namedColors.red}
        style={{ marginRight: 8, marginTop: 2 }}
      />
      <Text
        style={[styles.description, { fontSize: 12, lineHeight: 18, flex: 1 }]}
      >
        Some accounts could not be re-encrypted automatically. You may need to
        re-enter and save their recovery phrases manually.
      </Text>
    </View>
  </View>
);
