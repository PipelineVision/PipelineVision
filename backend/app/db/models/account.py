from sqlalchemy import (
    Column,
    String,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
    Integer,
)
from sqlalchemy.orm import relationship
import datetime

from app.db.session import Base


class AuthUser(Base):
    """
    Represents an authenticated user

    Attributes:
        id (str): The unique identifier for the user.
        name (str): The name of the user.
        email (str): The email address of the user.
        emailVerified (bool): Whether the user's email is verified.
        image (str): The URL of the user's profile image (optional).
        createdAt (datetime): The timestamp when the user was created.
        updatedAt (datetime): The timestamp when the user was last updated.

    Relationships:
        sessions (list[AuthSession]): The sessions associated with the user.
        accounts (list[AuthAccount]): The OAuth accounts linked to the user.
        organization_memberships (list[OrganizationMembership]): The organizations the user is a member of.
        preferences (list[UserPreference]): The user's preferences.
    """

    __tablename__ = "auth_users"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    emailVerified = Column(Boolean, nullable=False, default=False)
    image = Column(String, nullable=True)
    createdAt = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)
    updatedAt = Column(
        DateTime,
        nullable=False,
        default=datetime.datetime.utcnow,
        onupdate=datetime.datetime.utcnow,
    )

    sessions = relationship(
        "AuthSession", back_populates="user", cascade="all, delete-orphan"
    )
    accounts = relationship(
        "AuthAccount", back_populates="user", cascade="all, delete-orphan"
    )

    organization_memberships = relationship(
        "OrganizationMembership", back_populates="user", cascade="all, delete-orphan"
    )

    preferences = relationship(
        "UserPreference", back_populates="user", cascade="all, delete-orphan"
    )


class AuthVerification(Base):
    """
    Represents a verification record for authentication purposes.

    Attributes:
        id (str): The unique identifier for the verification record.
        identifier (str): The identifier for the verification (e.g., email).
        value (str): The value associated with the verification (e.g., verification token).
        expiresAt (datetime): The expiration timestamp for the verification.
        createdAt (datetime): The timestamp when the verification record was created.
        updatedAt (datetime): The timestamp when the verification record was last updated.
    """

    __tablename__ = "auth_verifications"

    id = Column(String, primary_key=True, index=True)
    identifier = Column(String, nullable=False)
    value = Column(String, nullable=False)
    expiresAt = Column(DateTime, nullable=False)
    createdAt = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)
    updatedAt = Column(
        DateTime,
        nullable=False,
        default=datetime.datetime.utcnow,
        onupdate=datetime.datetime.utcnow,
    )


class Organization(Base):
    """
    Represents a GitHub organization or personal account.

    Attributes:
        id (str): The unique identifier for the organization.
        github_id (int): The GitHub ID of the organization or user.
        login (str): The GitHub username or organization name.
        name (str): The display name of the organization (optional).
        avatar_url (str): The URL of the organization's avatar (optional).
        type (str): The type of the organization ("User" or "Organization").
        created_at (datetime): The timestamp when the organization was created.
        updated_at (datetime): The timestamp when the organization was last updated.

    Relationships:
        memberships (list[OrganizationMembership]): The memberships associated with the organization.
        installations (list[Installation]): The installations associated with the organization.
    """

    __tablename__ = "organizations"

    id = Column(String, primary_key=True, index=True)
    github_id = Column(Integer, unique=True, nullable=False)
    login = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    type = Column(String, nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)
    updated_at = Column(
        DateTime,
        nullable=False,
        default=datetime.datetime.utcnow,
        onupdate=datetime.datetime.utcnow,
    )

    memberships = relationship(
        "OrganizationMembership",
        back_populates="organization",
        cascade="all, delete-orphan",
    )
    installations = relationship(
        "Installation", back_populates="organization", cascade="all, delete-orphan"
    )


class OrganizationMembership(Base):
    """
    Represents a user's membership in an organization.

    Attributes:
        id (str): The unique identifier for the membership.
        user_id (str): The ID of the user associated with the membership.
        organization_id (str): The ID of the organization associated with the membership.
        role (str): The role of the user in the organization (e.g., "OWNER", "ADMIN", "MEMBER").
        active (bool): Whether the membership is active.
        joined_at (datetime): The timestamp when the user joined the organization.
        created_at (datetime): The timestamp when the membership was created.
        updated_at (datetime): The timestamp when the membership was last updated.

    Relationships:
        user (AuthUser): The user associated with the membership.
        organization (Organization): The organization associated with the membership.
    """

    __tablename__ = "organization_memberships"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(
        String, ForeignKey("auth_users.id", ondelete="CASCADE"), nullable=False
    )
    organization_id = Column(
        String, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    role = Column(String, nullable=False, default="MEMBER")
    active = Column(Boolean, nullable=False, default=True)
    joined_at = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)
    created_at = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)
    updated_at = Column(
        DateTime,
        nullable=False,
        default=datetime.datetime.utcnow,
        onupdate=datetime.datetime.utcnow,
    )

    user = relationship("AuthUser", back_populates="organization_memberships")
    organization = relationship("Organization", back_populates="memberships")


class AuthAccount(Base):
    """
    Represents an OAuth account linked to a user.

    Attributes:
        id (str): The unique identifier for the OAuth account.
        accountId (str): The OAuth provider's user ID.
        providerId (str): The OAuth provider (Currently only supporting Github).
        userId (str): The ID of the user associated with the OAuth account.
        accessToken (str): The access token for the OAuth account (optional).
        refreshToken (str): The refresh token for the OAuth account (optional).
        idToken (str): The ID token for the OAuth account (optional).
        accessTokenExpiresAt (datetime): The expiration timestamp for the access token (optional).
        refreshTokenExpiresAt (datetime): The expiration timestamp for the refresh token (optional).
        scope (str): The scope of the OAuth account (optional).
        password (str): The password for the OAuth account (optional).
        createdAt (datetime): The timestamp when the OAuth account was created.
        updatedAt (datetime): The timestamp when the OAuth account was last updated.

    Relationships:
        user (AuthUser): The user associated with the OAuth account.
    """

    __tablename__ = "auth_accounts"

    id = Column(String, primary_key=True, index=True)
    accountId = Column(String, nullable=False)
    providerId = Column(String, nullable=False)
    userId = Column(
        String, ForeignKey("auth_users.id", ondelete="CASCADE"), nullable=False
    )
    accessToken = Column(Text, nullable=True)
    refreshToken = Column(Text, nullable=True)
    idToken = Column(Text, nullable=True)
    accessTokenExpiresAt = Column(DateTime, nullable=True)
    refreshTokenExpiresAt = Column(DateTime, nullable=True)
    scope = Column(Text, nullable=True)
    password = Column(Text, nullable=True)
    createdAt = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)
    updatedAt = Column(
        DateTime,
        nullable=False,
        default=datetime.datetime.utcnow,
        onupdate=datetime.datetime.utcnow,
    )

    user = relationship("AuthUser", back_populates="accounts")


class AuthSession(Base):
    """
    Represents an authentication session for a user.

    Attributes:
        id (str): The unique identifier for the session.
        expiresAt (datetime): The expiration timestamp for the session.
        token (str): The unique session token.
        createdAt (datetime): The timestamp when the session was created.
        updatedAt (datetime): The timestamp when the session was last updated.
        ipAddress (str): The IP address of the user during the session (optional).
        userAgent (str): The user agent of the user during the session (optional).
        userId (str): The ID of the user associated with the session.
        current_organization_id (str): The ID of the current organization context for the session (optional).

    Relationships:
        user (AuthUser): The user associated with the session.
        current_organization (Organization): The current organization context for the session.
    """

    __tablename__ = "auth_sessions"

    id = Column(String, primary_key=True, index=True)
    expiresAt = Column(DateTime, nullable=False)
    token = Column(String, unique=True, nullable=False)
    createdAt = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)
    updatedAt = Column(
        DateTime,
        nullable=False,
        default=datetime.datetime.utcnow,
        onupdate=datetime.datetime.utcnow,
    )
    ipAddress = Column(String, nullable=True)
    userAgent = Column(String, nullable=True)
    userId = Column(
        String, ForeignKey("auth_users.id", ondelete="CASCADE"), nullable=False
    )
    # TODO: Delete this since its now handled on the UserPreference table
    current_organization_id = Column(
        String, ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True
    )

    user = relationship("AuthUser", back_populates="sessions")
    current_organization = relationship("Organization")
