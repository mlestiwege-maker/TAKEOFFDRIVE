import enum


class UserRole(str, enum.Enum):
    DRIVER = "DRIVER"
    ADMIN = "ADMIN"


class Gender(str, enum.Enum):
    MALE = "MALE"
    FEMALE = "FEMALE"
    OTHER = "OTHER"
    PREFER_NOT_TO_SAY = "PREFER_NOT_TO_SAY"


class VehicleType(str, enum.Enum):
    MOTORCYCLE = "MOTORCYCLE"
    BICYCLE = "BICYCLE"
    CAR = "CAR"
    VAN = "VAN"
    TRUCK = "TRUCK"


class DocumentType(str, enum.Enum):
    DRIVERS_LICENSE = "DRIVERS_LICENSE"
    NATIONAL_ID = "NATIONAL_ID"
    PROOF_OF_ADDRESS = "PROOF_OF_ADDRESS"
    VEHICLE_REGISTRATION = "VEHICLE_REGISTRATION"
    VEHICLE_INSURANCE = "VEHICLE_INSURANCE"
    VEHICLE_INSPECTION = "VEHICLE_INSPECTION"


class DocumentStatus(str, enum.Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"


class ApplicationStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    UNDER_REVIEW = "UNDER_REVIEW"
    CORRECTION_REQUIRED = "CORRECTION_REQUIRED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class ReviewDecision(str, enum.Enum):
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    CORRECTION_REQUIRED = "CORRECTION_REQUIRED"
