package com.physicalyy.habittracking.common.exception;

public class MissingOpenidException extends RuntimeException {

    public MissingOpenidException() {
        super("X-Test-Openid is required");
    }
}
