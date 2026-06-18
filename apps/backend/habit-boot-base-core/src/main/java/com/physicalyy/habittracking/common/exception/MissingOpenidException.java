package com.physicalyy.habittracking.common.exception;

public class MissingOpenidException extends UnauthorizedException {

    public MissingOpenidException() {
        super("Authentication is required");
    }
}
